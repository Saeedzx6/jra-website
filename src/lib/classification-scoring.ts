export type AnswerStatus = "MET" | "PARTIAL" | "NOT_MET" | "NOT_APPLICABLE";

export type StarBand = { minScore: number; maxScore: number; stars: number };

export type CriterionValue = { rating: number; dontHave: boolean };

export function criterionAchievedPoints(maxPoints: number, v: CriterionValue | undefined): number {
  if (!v || v.dontHave) return 0;
  return maxPoints * (Math.max(0, Math.min(10, v.rating)) / 10);
}

export function criterionStatus(v: CriterionValue | undefined): AnswerStatus {
  if (!v || v.dontHave || v.rating <= 0) return "NOT_MET";
  if (v.rating >= 10) return "MET";
  return "PARTIAL";
}

export function starsForScore(score: number, bands: StarBand[]): number {
  const band = bands.find((b) => score >= b.minScore && score <= b.maxScore);
  if (band) return band.stars;
  if (bands.length === 0) return 0;
  const max = bands.reduce((a, b) => (b.stars > a.stars ? b : a));
  return score > max.maxScore ? max.stars : 0;
}
