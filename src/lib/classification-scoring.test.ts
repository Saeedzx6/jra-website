import { describe, expect, it } from "vitest";
import {
  criterionAchievedPoints,
  criterionStatus,
  starsForScore,
  type StarBand,
} from "./classification-scoring";

/**
 * These functions decide how many stars an establishment is awarded, which is
 * the association's own regulatory judgement. A silent change here would
 * misgrade real restaurants, so the edge cases are pinned down explicitly.
 */

describe("criterionAchievedPoints", () => {
  it("awards the full weight at a rating of 10", () => {
    expect(criterionAchievedPoints(5, { rating: 10, dontHave: false })).toBe(5);
  });

  it("scales linearly between 0 and 10", () => {
    expect(criterionAchievedPoints(10, { rating: 5, dontHave: false })).toBe(5);
    expect(criterionAchievedPoints(4, { rating: 2.5, dontHave: false })).toBe(1);
  });

  it("awards nothing when the establishment does not have the item", () => {
    expect(criterionAchievedPoints(8, { rating: 10, dontHave: true })).toBe(0);
  });

  it("awards nothing for an unanswered criterion", () => {
    expect(criterionAchievedPoints(8, undefined)).toBe(0);
  });

  it("clamps out-of-range ratings rather than over- or under-awarding", () => {
    // A rating above 10 must not award more than the criterion is worth.
    expect(criterionAchievedPoints(6, { rating: 99, dontHave: false })).toBe(6);
    // A negative rating must not subtract points from the total.
    expect(criterionAchievedPoints(6, { rating: -5, dontHave: false })).toBe(0);
  });
});

describe("criterionStatus", () => {
  it("reports MET only at a full rating", () => {
    expect(criterionStatus({ rating: 10, dontHave: false })).toBe("MET");
    expect(criterionStatus({ rating: 9.9, dontHave: false })).toBe("PARTIAL");
  });

  it("reports NOT_MET for zero, negative, missing, or not-held criteria", () => {
    expect(criterionStatus({ rating: 0, dontHave: false })).toBe("NOT_MET");
    expect(criterionStatus({ rating: -1, dontHave: false })).toBe("NOT_MET");
    expect(criterionStatus(undefined)).toBe("NOT_MET");
    expect(criterionStatus({ rating: 10, dontHave: true })).toBe("NOT_MET");
  });
});

describe("starsForScore", () => {
  const bands: StarBand[] = [
    { minScore: 0, maxScore: 49, stars: 1 },
    { minScore: 50, maxScore: 69, stars: 2 },
    { minScore: 70, maxScore: 84, stars: 3 },
    { minScore: 85, maxScore: 94, stars: 4 },
    { minScore: 95, maxScore: 100, stars: 5 },
  ];

  it("places a score inside its band", () => {
    expect(starsForScore(60, bands)).toBe(2);
    expect(starsForScore(88, bands)).toBe(4);
  });

  it("treats band boundaries as inclusive at both ends", () => {
    expect(starsForScore(50, bands)).toBe(2);
    expect(starsForScore(69, bands)).toBe(2);
    expect(starsForScore(70, bands)).toBe(3);
  });

  it("caps at the top band when the score exceeds the published maximum", () => {
    // Rounding can push a total marginally past 100; that must still be 5 stars.
    expect(starsForScore(100.4, bands)).toBe(5);
  });

  it("returns 0 stars when no band matches and the score is below the range", () => {
    expect(starsForScore(-1, bands)).toBe(0);
  });

  it("returns 0 stars rather than throwing when a standard has no bands", () => {
    expect(starsForScore(80, [])).toBe(0);
  });

  it("returns 0 for a score that falls in a gap between bands", () => {
    const gapped: StarBand[] = [
      { minScore: 0, maxScore: 40, stars: 1 },
      { minScore: 60, maxScore: 100, stars: 2 },
    ];
    // A misconfigured standard should not silently award the higher grade.
    expect(starsForScore(50, gapped)).toBe(0);
  });
});
