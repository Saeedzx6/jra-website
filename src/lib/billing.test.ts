import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { formatMoney, statusForPayments, sumPayments, toDecimal, ZERO } from "./billing";

const D = (v: string | number) => new Prisma.Decimal(v);

describe("sumPayments", () => {
  it("sums exactly where floating point would drift", () => {
    // 0.1 + 0.2 !== 0.3 in binary floating point. With fils-level amounts on
    // hundreds of invoices that error compounds into a real reconciliation gap.
    const total = sumPayments([{ amount: D("0.100") }, { amount: D("0.200") }]);
    expect(total.equals(D("0.300"))).toBe(true);
    expect(total.toFixed(3)).toBe("0.300");
  });

  it("returns zero for no payments", () => {
    expect(sumPayments([]).equals(ZERO)).toBe(true);
  });

  it("handles many three-decimal amounts without drift", () => {
    const payments = Array.from({ length: 300 }, () => ({ amount: D("0.001") }));
    expect(sumPayments(payments).toFixed(3)).toBe("0.300");
  });
});

describe("statusForPayments", () => {
  const total = D("250.000");

  it("is PAID when settled exactly", () => {
    expect(statusForPayments(total, D("250.000"), "ISSUED")).toBe("PAID");
  });

  it("is PAID on overpayment rather than stuck part-paid", () => {
    expect(statusForPayments(total, D("260.000"), "ISSUED")).toBe("PAID");
  });

  it("is PART_PAID for anything above zero but short of the total", () => {
    expect(statusForPayments(total, D("249.999"), "ISSUED")).toBe("PART_PAID");
    expect(statusForPayments(total, D("0.001"), "ISSUED")).toBe("PART_PAID");
  });

  it("stays ISSUED with nothing paid", () => {
    expect(statusForPayments(total, ZERO, "ISSUED")).toBe("ISSUED");
  });

  it("keeps a draft in draft until it is issued", () => {
    expect(statusForPayments(total, ZERO, "DRAFT")).toBe("DRAFT");
  });

  it("never resurrects a voided invoice, even if money arrives against it", () => {
    expect(statusForPayments(total, D("250.000"), "VOID")).toBe("VOID");
  });

  it("treats a zero-value invoice as paid", () => {
    // Honorary members are billed 0.000; that should settle, not sit open.
    expect(statusForPayments(ZERO, ZERO, "ISSUED")).toBe("PAID");
  });
});

describe("formatMoney", () => {
  it("always shows three decimals — JOD divides into 1000 fils", () => {
    expect(formatMoney(D("250"))).toBe("250.000 JOD");
    expect(formatMoney(D("0.5"))).toBe("0.500 JOD");
  });

  it("groups thousands", () => {
    expect(formatMoney(D("1250.5"))).toBe("1,250.500 JOD");
    expect(formatMoney(D("1000000"))).toBe("1,000,000.000 JOD");
  });

  it("accepts a different currency label", () => {
    expect(formatMoney(D("10"), "USD")).toBe("10.000 USD");
  });
});

describe("toDecimal", () => {
  it("passes a Decimal through untouched", () => {
    const d = D("1.234");
    expect(toDecimal(d)).toBe(d);
  });

  it("parses strings exactly", () => {
    expect(toDecimal("1.005").toFixed(3)).toBe("1.005");
  });
});
