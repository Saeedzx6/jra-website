import { describe, expect, it } from "vitest";
import { addMonths, standingForTerm, GRACE_PERIOD_DAYS } from "./membership";

/**
 * Standing decides whether a member keeps their benefits and whether dues are
 * chased, so the boundaries are pinned down explicitly rather than left to
 * whatever the date arithmetic happens to do.
 */

describe("addMonths", () => {
  it("advances a whole year for the standard term", () => {
    expect(addMonths(new Date("2026-03-15T00:00:00Z"), 12).toISOString().slice(0, 10)).toBe(
      "2027-03-15"
    );
  });

  it("clamps to month end rather than overflowing into the next month", () => {
    // Naive month arithmetic turns 31 January into 3 March.
    expect(addMonths(new Date("2026-01-31T00:00:00Z"), 1).toISOString().slice(0, 10)).toBe(
      "2026-02-28"
    );
  });

  it("handles a leap year February", () => {
    expect(addMonths(new Date("2028-01-31T00:00:00Z"), 1).toISOString().slice(0, 10)).toBe(
      "2028-02-29"
    );
  });

  it("crosses a year boundary", () => {
    expect(addMonths(new Date("2026-12-10T00:00:00Z"), 1).toISOString().slice(0, 10)).toBe(
      "2027-01-10"
    );
  });
});

describe("standingForTerm", () => {
  const termEnd = new Date("2026-06-30T00:00:00Z");
  const daysAfter = (n: number) => {
    const d = new Date(termEnd);
    d.setDate(d.getDate() + n);
    return d;
  };

  it("is GOOD while the term is running", () => {
    expect(standingForTerm(termEnd, new Date("2026-01-01T00:00:00Z"))).toBe("GOOD");
  });

  it("is still GOOD on the final day of the term", () => {
    expect(standingForTerm(termEnd, termEnd)).toBe("GOOD");
  });

  it("enters GRACE the day after the term ends", () => {
    expect(standingForTerm(termEnd, daysAfter(1))).toBe("GRACE");
  });

  it("stays GRACE through the last day of the grace period", () => {
    expect(standingForTerm(termEnd, daysAfter(GRACE_PERIOD_DAYS))).toBe("GRACE");
  });

  it("lapses the day after grace expires", () => {
    // The boundary that decides whether benefits are cut off.
    expect(standingForTerm(termEnd, daysAfter(GRACE_PERIOD_DAYS + 1))).toBe("LAPSED");
  });

  it("is LAPSED long after the term", () => {
    expect(standingForTerm(termEnd, daysAfter(400))).toBe("LAPSED");
  });
});
