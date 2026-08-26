export type AnswerStatus = "MET" | "PARTIAL" | "NOT_MET" | "NOT_APPLICABLE";

export type StarBand = { minScore: number; maxScore: number; stars: number };

/**
 * An answer to one criterion.
 *
 * The documents award a row its marks or nothing — there is no half-met
 * requirement in any of the seven standards. This used to be a 0–10 rating
 * scaled into a fraction of the marks, which let an owner claim six tenths of
 * "an accessible entrance for people with disabilities" and produced a score
 * no inspector could arrive at. PARTIAL survives in AnswerStatus because
 * historical answers carry it; nothing new produces it.
 */
export type CriterionValue = { met: boolean };

export function criterionAchievedPoints(maxPoints: number, v: CriterionValue | undefined): number {
  return v?.met ? maxPoints : 0;
}

export function criterionStatus(v: CriterionValue | undefined): AnswerStatus {
  return v?.met ? "MET" : "NOT_MET";
}

export function starsForScore(score: number, bands: StarBand[]): number {
  const band = bands.find((b) => score >= b.minScore && score <= b.maxScore);
  if (band) return band.stars;
  if (bands.length === 0) return 0;
  const max = bands.reduce((a, b) => (b.stars > a.stars ? b : a));
  return score > max.maxScore ? max.stars : 0;
}

/**
 * How far off the next grade is.
 *
 * This is the one thing a self-assessment can tell an owner that a printed
 * standard cannot: not just where they stand, but what the next star costs.
 * Returns null once the top band is reached — there is nothing further to
 * aim at, and the caller says so instead.
 */
export function pointsToNextBand(
  score: number,
  bands: StarBand[]
): { needed: number; stars: number } | null {
  if (bands.length === 0) return null;
  const ascending = [...bands].sort((a, b) => a.minScore - b.minScore);
  const next = ascending.find((b) => score < b.minScore);
  if (!next) return null;
  return { needed: next.minScore - score, stars: next.stars };
}

/**
 * The result for a CERTIFICATION standard (fast food).
 *
 * Fast food is not rated on a scale: it carries the flat (معتمد سياحي)
 * tourism-approved category, and every mark in the document sits on a row
 * printed (اجباري) mandatory. So a total is the wrong question — what matters
 * is whether any mandatory requirement is unmet, and which. Optional rows
 * carry no marks and cannot fail the assessment.
 */
export function certificationResult(
  criteria: { id: string; mandatory: boolean }[],
  answers: Record<string, CriterionValue>
): { qualified: boolean; missingMandatory: string[] } {
  const missingMandatory = criteria
    .filter((c) => c.mandatory && !answers[c.id]?.met)
    .map((c) => c.id);
  return { qualified: missingMandatory.length === 0, missingMandatory };
}
