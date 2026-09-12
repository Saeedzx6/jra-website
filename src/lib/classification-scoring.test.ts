import { describe, expect, it } from "vitest";
import {
  certificationResult,
  criterionAchievedPoints,
  criterionStatus,
  pointsToNextBand,
  starsForScore,
  type StarBand,
} from "./classification-scoring";

/**
 * These functions decide how many stars an establishment is awarded, which is
 * the association's own regulatory judgement. A silent change here would
 * misgrade real restaurants, so the edge cases are pinned down explicitly.
 */

describe("criterionAchievedPoints", () => {
  it("awards the criterion's full marks when met", () => {
    expect(criterionAchievedPoints(5, { met: true })).toBe(5);
  });

  it("awards nothing when not met", () => {
    expect(criterionAchievedPoints(5, { met: false })).toBe(0);
  });

  it("awards nothing for an unanswered criterion", () => {
    expect(criterionAchievedPoints(8, undefined)).toBe(0);
  });

  it("never awards a fraction of a criterion", () => {
    // The documents award a row its marks or nothing. Anything in between is
    // a score no inspector could arrive at.
    for (const points of [1, 2, 4, 6, 48]) {
      expect(criterionAchievedPoints(points, { met: true })).toBe(points);
      expect(criterionAchievedPoints(points, { met: false })).toBe(0);
    }
  });
});

describe("criterionStatus", () => {
  it("reports MET only when met", () => {
    expect(criterionStatus({ met: true })).toBe("MET");
  });

  it("reports NOT_MET for unmet and unanswered criteria alike", () => {
    expect(criterionStatus({ met: false })).toBe("NOT_MET");
    expect(criterionStatus(undefined)).toBe("NOT_MET");
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

describe("pointsToNextBand", () => {
  // The real coffee shop bands: below 70 is unclassified.
  const bands: StarBand[] = [
    { minScore: 70, maxScore: 90, stars: 1 },
    { minScore: 91, maxScore: 120, stars: 2 },
    { minScore: 121, maxScore: 138, stars: 3 },
  ];

  it("counts up to the first star from an unclassified score", () => {
    expect(pointsToNextBand(0, bands)).toEqual({ needed: 70, stars: 1 });
    expect(pointsToNextBand(55, bands)).toEqual({ needed: 15, stars: 1 });
  });

  it("counts up to the next star from inside a band", () => {
    expect(pointsToNextBand(77, bands)).toEqual({ needed: 14, stars: 2 });
  });

  it("counts one point at the very edge of the next band", () => {
    expect(pointsToNextBand(90, bands)).toEqual({ needed: 1, stars: 2 });
  });

  it("returns null once the top band is reached", () => {
    expect(pointsToNextBand(121, bands)).toBeNull();
    expect(pointsToNextBand(138, bands)).toBeNull();
  });

  it("returns null rather than throwing when a standard has no bands", () => {
    // Fast food is graded by certification and has none.
    expect(pointsToNextBand(20, [])).toBeNull();
  });

  it("does not depend on the bands arriving in order", () => {
    const shuffled = [bands[2]!, bands[0]!, bands[1]!];
    expect(pointsToNextBand(77, shuffled)).toEqual({ needed: 14, stars: 2 });
  });
});

describe("certificationResult", () => {
  const criteria = [
    { id: "a", mandatory: true },
    { id: "b", mandatory: true },
    { id: "c", mandatory: false },
  ];

  it("qualifies when every mandatory requirement is met", () => {
    const answers = { a: { met: true }, b: { met: true } };
    expect(certificationResult(criteria, answers)).toEqual({
      qualified: true,
      missingMandatory: [],
    });
  });

  it("does not qualify on an unmet mandatory requirement, and names it", () => {
    const answers = { a: { met: true }, b: { met: false } };
    expect(certificationResult(criteria, answers)).toEqual({
      qualified: false,
      missingMandatory: ["b"],
    });
  });

  it("treats an unanswered mandatory requirement as unmet", () => {
    expect(certificationResult(criteria, {})).toEqual({
      qualified: false,
      missingMandatory: ["a", "b"],
    });
  });

  it("never fails on an optional requirement", () => {
    // Optional rows carry no marks and cannot cost an establishment its
    // certification, however many of them are left unmet.
    const answers = { a: { met: true }, b: { met: true }, c: { met: false } };
    expect(certificationResult(criteria, answers).qualified).toBe(true);
  });
});
