import { Prisma, type MemberStanding, type MembershipClass } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Membership lifecycle.
 *
 * Approving an application used to create a User, a listing and a manager link
 * and stop — the association ended up with applicants rather than members.
 * These functions add the missing half: a membership with a term and a
 * standing, and the sweep that moves it through grace into lapsed.
 */

/** Days after termEnd during which a member is late but not yet lapsed. */
export const GRACE_PERIOD_DAYS = 30;

/** Standard term. Dues are annual, so a membership runs a year from approval. */
export const TERM_MONTHS = 12;

export function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  // Rolling 31 Jan forward a month lands on 2/3 March; clamp back to month end
  // so a term started on the 31st ends on the last day, not early next month.
  if (d.getMonth() !== ((targetMonth % 12) + 12) % 12) d.setDate(0);
  return d;
}

/**
 * Standing implied by the term alone. SUSPENDED is a deliberate administrative
 * act rather than a function of dates, so the sweep never overrides it.
 */
export function standingForTerm(termEnd: Date, now = new Date()): MemberStanding {
  if (now <= termEnd) return "GOOD";
  const graceEnds = new Date(termEnd);
  graceEnds.setDate(graceEnds.getDate() + GRACE_PERIOD_DAYS);
  return now <= graceEnds ? "GRACE" : "LAPSED";
}

const APPLICANT_TO_CLASS: Record<string, MembershipClass> = {
  ACTIVE_RESTAURANT: "ACTIVE_RESTAURANT",
  ASSOCIATE_SUPPLIER: "ASSOCIATE_SUPPLIER",
};

/** JRA-2026-00001 — quotable on an invoice or over the phone. */
async function nextMemberNumber(year: number): Promise<string> {
  const prefix = `JRA-${year}-`;
  const last = await db.membership.findFirst({
    where: { memberNumber: { startsWith: prefix } },
    orderBy: { memberNumber: "desc" },
    select: { memberNumber: true },
  });
  const seq = last ? Number(last.memberNumber.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(seq).padStart(5, "0")}`;
}

export type ProvisionInput = {
  applicationId: string;
  applicantType: string;
  restaurantId?: string | null;
  supplierId?: string | null;
  startAt?: Date;
};

/**
 * Creates the membership for a newly approved application.
 *
 * Idempotent: the unique constraints on applicationId/restaurantId/supplierId
 * mean a double-approval returns the existing membership rather than creating
 * a second one. The member-number sequence is racy by nature, so a unique
 * violation on it is retried rather than surfaced.
 */
export async function provisionMembership(input: ProvisionInput) {
  const existing = await db.membership.findFirst({
    where: {
      OR: [
        { applicationId: input.applicationId },
        ...(input.restaurantId ? [{ restaurantId: input.restaurantId }] : []),
        ...(input.supplierId ? [{ supplierId: input.supplierId }] : []),
      ],
    },
  });
  if (existing) return existing;

  const termStart = input.startAt ?? new Date();
  const termEnd = addMonths(termStart, TERM_MONTHS);
  const cls = APPLICANT_TO_CLASS[input.applicantType] ?? "ACTIVE_RESTAURANT";

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.membership.create({
        data: {
          memberNumber: await nextMemberNumber(termStart.getFullYear()),
          class: cls,
          standing: "GOOD",
          termStart,
          termEnd,
          applicationId: input.applicationId,
          restaurantId: input.restaurantId ?? null,
          supplierId: input.supplierId ?? null,
        },
      });
    } catch (e) {
      const raced =
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        String(e.meta?.target ?? "").includes("memberNumber");
      if (!raced) throw e;
    }
  }
  throw new Error("Could not allocate a member number after 5 attempts");
}

/**
 * Moves memberships through GOOD → GRACE → LAPSED as their terms elapse.
 * Intended for a nightly job; safe to run repeatedly.
 */
export async function sweepStandings(now = new Date()) {
  const due = await db.membership.findMany({
    where: { standing: { not: "SUSPENDED" }, termEnd: { lt: now } },
    select: { id: true, standing: true, termEnd: true },
  });

  const changes: Record<string, number> = {};
  for (const m of due) {
    const next = standingForTerm(m.termEnd, now);
    if (next === m.standing) continue;
    await db.membership.update({ where: { id: m.id }, data: { standing: next } });
    changes[next] = (changes[next] ?? 0) + 1;
  }
  return { examined: due.length, changed: changes };
}

/** Counts for the admin dashboard. */
export async function membershipHealth() {
  const [good, grace, lapsed, suspended, expiringSoon] = await Promise.all([
    db.membership.count({ where: { standing: "GOOD" } }),
    db.membership.count({ where: { standing: "GRACE" } }),
    db.membership.count({ where: { standing: "LAPSED" } }),
    db.membership.count({ where: { standing: "SUSPENDED" } }),
    db.membership.count({
      where: {
        standing: "GOOD",
        termEnd: { gte: new Date(), lte: addMonths(new Date(), 1) },
      },
    }),
  ]);
  return { good, grace, lapsed, suspended, expiringSoon, total: good + grace + lapsed + suspended };
}
