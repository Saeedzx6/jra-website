/**
 * The shape the checklist components read.
 *
 * These mirror the Prisma rows rather than re-deriving them, so a page can
 * hand a standard straight from `getStandardWithCriteria` to the checklist.
 * Kept out of `lib/classification.ts` because that imports the database
 * client and these types are consumed by client components.
 */

export type GradingMode = "STARS" | "CERTIFICATION";

export type Criterion = {
  id: string;
  /// The numbering printed in the document, e.g. "5.3".
  code: string | null;
  groupEn: string | null;
  groupAr: string | null;
  textEn: string;
  textAr: string | null;
  detailEn: string | null;
  detailAr: string | null;
  maxPoints: number;
  mandatory: boolean;
};

export type Section = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string | null;
  /// The ملاحظات a document prints against a whole section — often a waiver.
  noteEn: string | null;
  noteAr: string | null;
  criteria: Criterion[];
};

/**
 * Arabic is the authoritative text in every one of these documents, but the
 * standards transcribed before the bilingual seed have English only. Falling
 * back keeps a half-translated standard readable instead of blank.
 */
export function localized(locale: string, ar: string | null, en: string | null): string {
  if (locale === "ar") return ar?.trim() || en?.trim() || "";
  return en?.trim() || ar?.trim() || "";
}

/** A dash is how the documents write "no requirement text of its own". */
export const DASH = "—";

export function isDash(value: string): boolean {
  return value.trim() === DASH || value.trim() === "-";
}

/**
 * What to call a row on screen. Most rows are named by their requirement; the
 * ones the document leaves as a dash (ميزات خاصة, "special features") are named
 * only by the group heading they sit under.
 */
export function criterionLabel(locale: string, c: Criterion): string {
  const text = localized(locale, c.textAr, c.textEn);
  if (!isDash(text)) return text;
  return localized(locale, c.groupAr, c.groupEn) || text;
}

export function sectionScore(section: Section, answers: Record<string, { met: boolean }>): number {
  return section.criteria.reduce((sum, c) => sum + (answers[c.id]?.met ? c.maxPoints : 0), 0);
}

export function sectionMax(section: Section): number {
  return section.criteria.reduce((sum, c) => sum + c.maxPoints, 0);
}
