"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { ClassificationSeal } from "./seal";
import { CriterionInput } from "./criterion-input";
import {
  criterionAchievedPoints,
  starsForScore,
  type CriterionValue,
  type StarBand,
} from "@/lib/classification-scoring";
import { saveAnswer, submitAssessment } from "@/lib/actions/classification";

type Criterion = {
  id: string;
  textEn: string;
  textAr: string | null;
  maxPoints: number;
};

type Section = {
  id: string;
  nameEn: string;
  nameAr: string | null;
  criteria: Criterion[];
};

export function ClassificationChecklist({
  sessionId,
  sections,
  initialAnswers,
  starBands,
  totalPoints,
  alreadySubmitted,
  submittedScore,
  submittedStars,
}: {
  sessionId: string;
  sections: Section[];
  initialAnswers: Record<string, CriterionValue>;
  starBands: StarBand[];
  totalPoints: number;
  alreadySubmitted: boolean;
  submittedScore: number | null;
  submittedStars: number | null;
}) {
  const locale = useLocale();
  const tc = useTranslations("classification");
  const tCommon = useTranslations("common");
  const [answers, setAnswers] = useState<Record<string, CriterionValue>>(initialAnswers);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ score: number; stars: number } | null>(
    alreadySubmitted && submittedScore !== null && submittedStars !== null
      ? { score: submittedScore, stars: submittedStars }
      : null
  );

  const allCriteria = useMemo(() => sections.flatMap((s) => s.criteria), [sections]);
  const totalCriteria = allCriteria.length;
  const answeredCount = Object.keys(answers).length;

  const score = useMemo(
    () =>
      allCriteria.reduce((sum, c) => sum + criterionAchievedPoints(c.maxPoints, answers[c.id]), 0),
    [answers, allCriteria]
  );

  const percent = totalPoints > 0 ? Math.min(100, (score / totalPoints) * 100) : 0;
  const maxStars = starBands.length > 0 ? Math.max(...starBands.map((b) => b.stars)) : 5;
  const projectedStars = starsForScore(score, starBands);

  function setAnswer(criterionId: string, value: CriterionValue) {
    setAnswers((prev) => ({ ...prev, [criterionId]: value }));
    startTransition(async () => {
      await saveAnswer(sessionId, criterionId, value);
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      const res = await submitAssessment(sessionId);
      setResult({ score: res.totalScore, stars: res.resultingStars });
    });
  }

  if (result) {
    return (
      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-rule bg-surface p-6">
          <ClassificationSeal
            percent={totalPoints > 0 ? (result.score / totalPoints) * 100 : 0}
            score={result.score}
            totalPoints={totalPoints}
            stars={result.stars}
            maxStars={maxStars}
          />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            {tc("assessmentSubmitted")}
          </h2>
          <p className="mt-2 max-w-xl text-ink-soft">
            {tc("resultPrefix")}{" "}
            <strong className="text-ink">
              {result.stars} {result.stars === 1 ? tCommon("star") : tCommon("stars")}
            </strong>{" "}
            {tc("resultSuffix", { score: Math.round(result.score), total: totalPoints })}
          </p>
          <div className="mt-8 space-y-4 print:mt-4">
            {sections.map((s) => {
              const sectionScore = s.criteria.reduce(
                (sum, c) => sum + criterionAchievedPoints(c.maxPoints, answers[c.id]),
                0
              );
              const sectionMax = s.criteria.reduce((sum, c) => sum + c.maxPoints, 0);
              return (
                <div key={s.id} className="rounded-xl border border-rule bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">
                      {locale === "ar" && s.nameAr ? s.nameAr : s.nameEn}
                    </span>
                    <span className="tabular text-sm text-ink-soft">
                      {Math.round(sectionScore)} / {sectionMax}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-olive"
                      style={{ width: `${sectionMax > 0 ? (sectionScore / sectionMax) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button suppressHydrationWarning
            onClick={() => window.print()}
            className="mt-8 rounded-full border border-accent px-6 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white print:hidden"
          >
            {tc("savePdf")}
          </button>
        </div>
      </div>
    );
  }

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
          {tc("answeredCount", { answered: answeredCount, total: totalCriteria })}
        </div>
        <button suppressHydrationWarning
          onClick={handleSubmit}
          disabled={pending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {tc("submitAssessment")}
        </button>
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
                  onChange={(value) => setAnswer(criterion.id, value)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
