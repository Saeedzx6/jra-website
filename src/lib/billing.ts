import {
  Prisma,
  type EstablishmentType,
  type InvoiceStatus,
  type MembershipClass,
  type PaymentMethod,
} from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Dues billing.
 *
 * All money is Prisma.Decimal. Never convert to Number for arithmetic that is
 * then persisted — summing invoice lines or reconciling payments in binary
 * floating point loses fractions, and JOD carries three decimal places (fils),
 * so the error shows up quickly.
 */

export const ZERO = new Prisma.Decimal(0);

/** Days from issue to due date on a dues invoice. */
export const PAYMENT_TERMS_DAYS = 30;

export function toDecimal(v: Prisma.Decimal | number | string): Prisma.Decimal {
  return v instanceof Prisma.Decimal ? v : new Prisma.Decimal(v);
}

/** Formats for display, e.g. "1,250.000 JOD". */
export function formatMoney(amount: Prisma.Decimal | number | string, currency = "JOD"): string {
  const d = toDecimal(amount);
  const [whole, frac = ""] = d.toFixed(3).split(".");
  const grouped = (whole ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped}.${frac.padEnd(3, "0")} ${currency}`;
}

/**
 * The fee row in force for an establishment at a point in time.
 *
 * JRA prices by establishment type, not by membership class: tourist
 * restaurants pay on their star grade, while coffee shops, fast food and
 * bar/nightclub/disco each sit at one flat rate. An exact grade match beats
 * the type's flat row, which in turn beats a class-wide row — so a five-star
 * restaurant is charged its own rate and anything ungraded falls back
 * sensibly rather than resolving to nothing.
 */
export async function resolveDues(
  cls: MembershipClass,
  establishmentType: EstablishmentType | null,
  stars: number | null,
  at: Date = new Date()
) {
  const rows = await db.duesSchedule.findMany({
    where: {
      class: cls,
      effectiveFrom: { lte: at },
      AND: [{ OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }] }],
    },
    orderBy: [{ effectiveFrom: "desc" }],
  });
  if (rows.length === 0) return null;

  const forType = rows.filter((r) => r.establishmentType === establishmentType);
  return (
    // Exact grade for this establishment type.
    forType.find((r) => r.stars === stars) ??
    // The type's flat rate, for anything ungraded.
    forType.find((r) => r.stars === null) ??
    // A class-wide row, used for suppliers and honorary members.
    rows.find((r) => r.establishmentType === null && r.stars === null) ??
    null
  );
}

async function nextInvoiceNumber(year: number): Promise<string> {
  const prefix = `INV-${year}-`;
  const last = await db.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const seq = last ? Number(last.number.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(seq).padStart(5, "0")}`;
}

export type CreateInvoiceResult =
  | { ok: true; invoiceId: string; number: string; total: Prisma.Decimal }
  | { ok: false; reason: "no_dues_schedule" | "already_invoiced" | "not_found" };

/**
 * Raises the dues invoice for a membership's current term.
 *
 * Idempotent per term: if an invoice already covers this period the existing
 * one is reported rather than a second raised, so a billing run can be re-run
 * safely after a partial failure.
 */
export async function createInvoiceForMembership(
  membershipId: string,
  opts: { issue?: boolean; at?: Date } = {}
): Promise<CreateInvoiceResult> {
  const at = opts.at ?? new Date();
  const membership = await db.membership.findUnique({
    where: { id: membershipId },
    include: { restaurant: { include: { classificationLevel: true } } },
  });
  if (!membership) return { ok: false, reason: "not_found" };

  const existing = await db.invoice.findFirst({
    where: {
      membershipId,
      periodStart: membership.termStart,
      periodEnd: membership.termEnd,
      status: { not: "VOID" },
    },
  });
  if (existing) return { ok: false, reason: "already_invoiced" };

  const stars = membership.restaurant?.classificationLevel?.stars ?? null;
  const establishmentType = membership.restaurant?.establishmentType ?? null;
  const dues = await resolveDues(membership.class, establishmentType, stars, at);
  if (!dues) return { ok: false, reason: "no_dues_schedule" };

  const amount = toDecimal(dues.annualAmount);
  const dueAt = new Date(opts.issue === false ? membership.termStart : at);
  dueAt.setDate(dueAt.getDate() + PAYMENT_TERMS_DAYS);

  const kind = (establishmentType ?? membership.class).replace(/_/g, " ").toLowerCase();
  const label =
    stars != null
      ? `Annual membership dues (${kind}, ${stars}-star)`
      : `Annual membership dues (${kind})`;

  const invoice = await db.invoice.create({
    data: {
      number: await nextInvoiceNumber(at.getFullYear()),
      membershipId,
      periodStart: membership.termStart,
      periodEnd: membership.termEnd,
      issuedAt: opts.issue === false ? null : at,
      dueAt,
      status: opts.issue === false ? "DRAFT" : "ISSUED",
      currency: dues.currency,
      total: amount,
      lines: {
        create: [{ description: label, quantity: 1, unitAmount: amount, sortOrder: 0 }],
      },
    },
  });

  return { ok: true, invoiceId: invoice.id, number: invoice.number, total: amount };
}

/** Sum of settled payments against an invoice. */
export function sumPayments(payments: { amount: Prisma.Decimal }[]): Prisma.Decimal {
  return payments.reduce((acc, p) => acc.plus(toDecimal(p.amount)), ZERO);
}

/**
 * Status implied by what has actually been paid. Kept as a pure function so the
 * transitions are testable without touching the database.
 */
export function statusForPayments(
  total: Prisma.Decimal,
  paid: Prisma.Decimal,
  current: InvoiceStatus
): InvoiceStatus {
  if (current === "VOID") return "VOID";
  if (paid.greaterThanOrEqualTo(total)) return "PAID";
  if (paid.greaterThan(ZERO)) return "PART_PAID";
  return current === "DRAFT" ? "DRAFT" : "ISSUED";
}

export async function recordPayment(input: {
  invoiceId: string;
  amount: Prisma.Decimal | number | string;
  method?: PaymentMethod;
  reference?: string | null;
  paidAt?: Date;
  recordedById?: string | null;
}) {
  const invoice = await db.invoice.findUnique({
    where: { id: input.invoiceId },
    include: { payments: true },
  });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "VOID") throw new Error("Cannot pay a voided invoice");

  const amount = toDecimal(input.amount);
  if (amount.lessThanOrEqualTo(ZERO)) throw new Error("Payment amount must be positive");

  await db.payment.create({
    data: {
      invoiceId: invoice.id,
      amount,
      method: input.method ?? "BANK_TRANSFER",
      reference: input.reference ?? null,
      paidAt: input.paidAt ?? new Date(),
      recordedById: input.recordedById ?? null,
    },
  });

  const paid = sumPayments([...invoice.payments, { amount }]);
  const status = statusForPayments(toDecimal(invoice.total), paid, invoice.status);
  await db.invoice.update({ where: { id: invoice.id }, data: { status } });

  return { paid, outstanding: toDecimal(invoice.total).minus(paid), status };
}

/** Raises invoices for every membership whose term is not yet billed. */
export async function runBilling(opts: { at?: Date; issue?: boolean } = {}) {
  const at = opts.at ?? new Date();
  const memberships = await db.membership.findMany({
    where: { standing: { in: ["GOOD", "GRACE"] } },
    select: { id: true },
  });

  const result = { created: 0, skipped: 0, noSchedule: 0, total: ZERO };
  for (const m of memberships) {
    const r = await createInvoiceForMembership(m.id, { at, issue: opts.issue });
    if (r.ok) {
      result.created++;
      result.total = result.total.plus(r.total);
    } else if (r.reason === "no_dues_schedule") result.noSchedule++;
    else result.skipped++;
  }
  return result;
}

/** Revenue figures for the admin dashboard. */
export async function revenueSummary() {
  const invoices = await db.invoice.findMany({
    where: { status: { not: "VOID" } },
    select: { total: true, status: true, dueAt: true, payments: { select: { amount: true } } },
  });

  const now = new Date();
  let invoiced = ZERO;
  let collected = ZERO;
  let overdue = ZERO;
  for (const inv of invoices) {
    const total = toDecimal(inv.total);
    const paid = sumPayments(inv.payments);
    invoiced = invoiced.plus(total);
    collected = collected.plus(paid);
    if (inv.status !== "PAID" && inv.dueAt < now) overdue = overdue.plus(total.minus(paid));
  }
  return {
    invoiced,
    collected,
    outstanding: invoiced.minus(collected),
    overdue,
    count: invoices.length,
  };
}
