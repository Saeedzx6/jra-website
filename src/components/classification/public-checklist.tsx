"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ScoreMeter } from "./score-meter";
import { SectionTiles } from "./section-tiles";
import { SectionSheet } from "./section-sheet";
import { SubmitAssessmentForm } from "./submit-assessment-form";
import { localized, sectionMax, sectionScore, type GradingMode, type Section } from "./types";
import {
  certificationResult,
  starsForScore,
  type CriterionValue,
  type StarBand,
} from "@/lib/classification-scoring";

/**
 * The anonymous version: nothing is saved, and the score is the point.
 *
 * There is no "reveal my result" gate any more. Under binary marking an
 * untouched row is a real answer — it means the establishment does not meet
 * that requirement — so the running total is honest from the first tap, and
 * hiding it until every row is visited only made the tool feel like a form.
 */
export function PublicClassificationChecklist({
  establishmentType,
  sections,
  starBands,
  totalPoints,
  gradingMode,
}: {
  establishmentType: string;
  sections: Section[];
  starBands: StarBand[];
  totalPoints: number;
  gradingMode: GradingMode;
}) {
  const locale = useLocale();
  const tc = useTranslations("classification");
  const tCommon = useTranslations("common");
  const [answers, setAnswers] = useState<Record<string, CriterionValue>>({});
  const [openSection, setOpenSection] = useState<Section | null>(null);

  const allCriteria = useMemo(() => sections.flatMap((s) => s.criteria), [sections]);
  const score = useMemo(
    () => sections.reduce((sum, s) => sum + sectionScore(s, answers), 0),
    [sections, answers]
  );

  const projectedStars = starsForScore(score, starBands);
  const mandatory = useMemo(() => allCriteria.filter((c) => c.mandatory), [allCriteria]);
  const certification = certificationResult(allCriteria, answers);
  const touched = Object.values(answers).some((v) => v.met);

  // The sheet holds a snapshot of the section it was opened with, so it has to
  // be re-read from the live list for its tick marks to update as they change.
  const liveOpenSection = openSection
    ? (sections.find((s) => s.id === openSection.id) ?? null)
    : null;

  return (
    <div className="space-y-6">
      <ScoreMeter
        score={score}
        totalPoints={totalPoints}
        bands={starBands}
        gradingMode={gradingMode}
        mandatoryMet={mandatory.length - certification.missingMandatory.length}
        mandatoryTotal={mandatory.length}
      />

      <SectionTiles sections={sections} answers={answers} onOpen={setOpenSection} />

      <SectionSheet
        section={liveOpenSection}
        answers={answers}
        onToggle={(criterionId, met) =>
          setAnswers((prev) => ({ ...prev, [criterionId]: { met } }))
        }
        onClose={() => setOpenSection(null)}
      />

      {touched ? (
        <div className="rounded-2xl border border-rule bg-surface p-5">
          <p className="text-sm text-ink-soft">
            {gradingMode === "CERTIFICATION"
              ? certification.qualified
                ? tc("allMandatoryMet")
                : tc("missingMandatory", { count: certification.missingMandatory.length })
              : `${tc("projectsTo")} ${projectedStars} ${
                  projectedStars === 1 ? tCommon("star") : tCommon("stars")
                }`}
          </p>
          <Link
            href="/membership"
            className="mt-3 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            {tc("applyToJoin")}
          </Link>
          <SubmitAssessmentForm
            payload={{
              establishmentType,
              score,
              totalPoints,
              stars: projectedStars,
              sections: sections.map((s) => ({
                name: localized(locale, s.nameAr, s.nameEn),
                score: sectionScore(s, answers),
                max: sectionMax(s),
              })),
            }}
          />
          <p className="mt-4 text-xs text-ink-faint">{tc("rateNote")}</p>
        </div>
      ) : (
        <p className="text-sm text-ink-faint">{tc("rateNote")}</p>
      )}
    </div>
  );
}
