"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Lock } from "lucide-react";
import { ClassificationSeal } from "./seal";
import { ScoreMeter } from "./score-meter";
import { SectionTiles } from "./section-tiles";
import { SectionSheet } from "./section-sheet";
import { localized, sectionMax, sectionScore, type GradingMode, type Section } from "./types";
import {
  certificationResult,
  starsForScore,
  type CriterionValue,
  type StarBand,
} from "@/lib/classification-scoring";
import { saveAnswer, submitAssessment } from "@/lib/actions/classification";

/**
 * The portal version: the same checklist, but every tick is saved against the
 * establishment's assessment session and the result goes to JRA for review.
 *
 * Ticks are written optimistically. An owner filling this in on a phone in
 * their own dining room should never wait on a round trip to see a box
 * checked; if the save fails the answer rolls back and says so, which is the
 * only case where the delay is worth their attention.
 */
export function ClassificationChecklist({
  sessionId,
  sections,
  initialAnswers,
  starBands,
  totalPoints,
  gradingMode,
  readOnly,
  alreadySubmitted,
  submittedScore,
  submittedStars,
}: {
  sessionId: string;
  sections: Section[];
  initialAnswers: Record<string, CriterionValue>;
  starBands: StarBand[];
  totalPoints: number;
  gradingMode: GradingMode;
  /** True for any session that is not IN_PROGRESS — submitted, or awaiting JRA. */
  readOnly: boolean;
  alreadySubmitted: boolean;
  submittedScore: number | null;
  submittedStars: number | null;
}) {
  const locale = useLocale();
  const tc = useTranslations("classification");
  const tCommon = useTranslations("common");
  const [answers, setAnswers] = useState<Record<string, CriterionValue>>(initialAnswers);
  const [openSection, setOpenSection] = useState<Section | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ score: number; stars: number } | null>(
    alreadySubmitted && submittedScore !== null && submittedStars !== null
      ? { score: submittedScore, stars: submittedStars }
      : null
  );

  const allCriteria = useMemo(() => sections.flatMap((s) => s.criteria), [sections]);
  const score = useMemo(
    () => sections.reduce((sum, s) => sum + sectionScore(s, answers), 0),
    [sections, answers]
  );

  const maxStars = starBands.length > 0 ? Math.max(...starBands.map((b) => b.stars)) : 5;
  const projectedStars = starsForScore(score, starBands);
  const mandatory = useMemo(() => allCriteria.filter((c) => c.mandatory), [allCriteria]);
  const certification = certificationResult(allCriteria, answers);

  function toggle(criterionId: string, met: boolean) {
    const previous = answers[criterionId];
    setAnswers((prev) => ({ ...prev, [criterionId]: { met } }));
    setSaveError(false);
    startTransition(async () => {
      try {
        await saveAnswer(sessionId, criterionId, { met });
      } catch {
        // Put the answer back rather than leaving a tick on screen that is not
        // in the database — this one is going to JRA.
        setAnswers((prev) => {
          const next = { ...prev };
          if (previous) next[criterionId] = previous;
          else delete next[criterionId];
          return next;
        });
        setSaveError(true);
      }
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      const res = await submitAssessment(sessionId);
      // A certification standard returns no stars; the seal shows none.
      setResult({ score: res.totalScore, stars: res.resultingStars ?? 0 });
    });
  }

  if (result) {
    return (
      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <div className="h-fit rounded-2xl border border-rule bg-surface p-6">
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
              const sScore = sectionScore(s, answers);
              const sMax = sectionMax(s);
              return (
                <div key={s.id} className="rounded-xl border border-rule bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">
                      {localized(locale, s.nameAr, s.nameEn)}
                    </span>
                    <span className="tabular text-sm text-ink-soft">
                      {Math.round(sScore)} / {sMax}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-olive"
                      style={{ width: `${sMax > 0 ? (sScore / sMax) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button
            suppressHydrationWarning
            onClick={() => window.print()}
            className="mt-8 rounded-full border border-accent px-6 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white print:hidden"
          >
            {tc("savePdf")}
          </button>
        </div>
      </div>
    );
  }

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

      {readOnly ? (
        <p className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm text-ink-soft">
          <Lock className="h-4 w-4 shrink-0" />
          {tc("readOnlyNotice")}
        </p>
      ) : null}

      {saveError ? (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger-text">
          {tc("saveFailed")}
        </p>
      ) : null}

      <SectionTiles sections={sections} answers={answers} onOpen={setOpenSection} />

      <SectionSheet
        section={liveOpenSection}
        answers={answers}
        readOnly={readOnly}
        onToggle={toggle}
        onClose={() => setOpenSection(null)}
      />

      {!readOnly ? (
        <button
          suppressHydrationWarning
          onClick={handleSubmit}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {tc("submitAssessment")}
        </button>
      ) : null}
    </div>
  );
}
