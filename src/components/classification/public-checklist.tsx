"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ClassificationSeal } from "./seal";
import { CriterionInput } from "./criterion-input";
import { SubmitAssessmentForm } from "./submit-assessment-form";
import {
  criterionAchievedPoints,
  starsForScore,
  type CriterionValue,
  type StarBand,
} from "@/lib/classification-scoring";

type Criterion = { id: string; textEn: string; textAr: string | null; maxPoints: number };
type Section = { id: string; nameEn: string; nameAr: string | null; criteria: Criterion[] };

export function PublicClassificationChecklist({
  establishmentType,
  sections,
  starBands,
  totalPoints,
}: {
  establishmentType: string;
  sections: Section[];
  starBands: StarBand[];
  totalPoints: number;
}) {
  const locale = useLocale();
  const tc = useTranslations("classification");
  const tCommon = useTranslations("common");
  const [answers, setAnswers] = useState<Record<string, CriterionValue>>({});
  const [revealed, setRevealed] = useState(false);

  const allCriteria = useMemo(() => sections.flatMap((s) => s.criteria), [sections]);
  const answeredCount = Object.keys(answers).length;

  const score = useMemo(
    () =>
      allCriteria.reduce((sum, c) => sum + criterionAchievedPoints(c.maxPoints, answers[c.id]), 0),
    [answers, allCriteria]
  );

  const percent = totalPoints > 0 ? Math.min(100, (score / totalPoints) * 100) : 0;
  const maxStars = starBands.length > 0 ? Math.max(...starBands.map((b) => b.stars)) : 5;
  const projectedStars = starsForScore(score, starBands);

  const sectionBreakdown = useMemo(
    () =>
      sections.map((s) => ({
        name: s.nameEn,
        score: s.criteria.reduce((sum, c) => sum + criterionAchievedPoints(c.maxPoints, answers[c.id]), 0),
        max: s.criteria.reduce((sum, c) => sum + c.maxPoints, 0),
      })),
    [sections, answers]
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
      <div className="h-fit rounded-2xl border border-rule bg-surface p-6 lg:sticky lg:top-24">
        <ClassificationSeal
          percent={percent}
          score={score}
          totalPoints={totalPoints}
          stars={projectedStars}
          maxStars={maxStars}
        />
        <div className="mt-6 text-center text-sm text-ink-soft">
          {tc("answeredCount", { answered: answeredCount, total: allCriteria.length })}
        </div>
        {!revealed && answeredCount === allCriteria.length && (
          <button suppressHydrationWarning
            onClick={() => setRevealed(true)}
            className="mt-4 w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            {tc("seeMyResult")}
          </button>
        )}
        {revealed && (
          <>
            <div className="mt-4 rounded-xl bg-olive-soft p-4 text-center">
              <Sparkles className="mx-auto h-5 w-5 text-olive" />
              <p className="mt-1 text-sm font-medium text-olive">
                {tc("projectsTo")} {projectedStars}{" "}
                {projectedStars === 1 ? tCommon("star") : tCommon("stars")}
              </p>
              <Link
                href="/membership"
                className="mt-3 block rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white"
              >
                {tc("applyToJoin")}
              </Link>
            </div>
            <SubmitAssessmentForm
              payload={{
                establishmentType,
                score,
                totalPoints,
                stars: projectedStars,
                sections: sectionBreakdown,
              }}
            />
          </>
        )}
        <p className="mt-4 text-center text-xs text-ink-faint">{tc("rateNote")}</p>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.id} className="rounded-2xl border border-rule bg-surface p-6">
            <h2 className="font-display text-lg font-semibold text-ink">
              {locale === "ar" && section.nameAr ? section.nameAr : section.nameEn}
            </h2>
            <div className="mt-4 divide-y divide-rule">
              {section.criteria.map((criterion) => (
                <CriterionInput
                  key={criterion.id}
                  label={locale === "ar" && criterion.textAr ? criterion.textAr : criterion.textEn}
                  points={criterion.maxPoints}
                  value={answers[criterion.id]}
                  onChange={(value) => {
                    setAnswers((prev) => ({ ...prev, [criterion.id]: value }));
                    setRevealed(false);
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
