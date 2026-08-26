"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { pointsToNextBand, type StarBand } from "@/lib/classification-scoring";
import type { GradingMode } from "./types";

/**
 * The running total, where it sits against the published grades, and what the
 * next star costs.
 *
 * That last line is the only thing a self-assessment can tell an owner that
 * the printed standard cannot. "You are 14 marks short of two stars" turns a
 * checklist into something worth finishing; a bare score does not.
 *
 * The rail is drawn against the standard's own bands rather than a fixed set
 * of five, because the documents disagree: restaurants run to five stars,
 * bars and coffee shops stop at three, and fast food has no stars at all.
 */
export function ScoreMeter({
  score,
  totalPoints,
  bands,
  gradingMode,
  mandatoryMet,
  mandatoryTotal,
}: {
  score: number;
  totalPoints: number;
  bands: StarBand[];
  gradingMode: GradingMode;
  /** CERTIFICATION only. */
  mandatoryMet?: number;
  mandatoryTotal?: number;
}) {
  const tc = useTranslations("classification");

  if (gradingMode === "CERTIFICATION") {
    const met = mandatoryMet ?? 0;
    const total = mandatoryTotal ?? 0;
    const outstanding = Math.max(0, total - met);
    const qualified = total > 0 && outstanding === 0;

    return (
      <div className="rounded-2xl border border-rule bg-surface p-5">
        <div className="flex items-baseline gap-2">
          <span className="tabular font-display text-3xl font-semibold text-ink">{met}</span>
          <span className="tabular text-sm text-ink-faint">/ {total}</span>
          <span
            className={`ms-auto text-sm font-medium ${qualified ? "text-olive-text" : "text-ink-faint"}`}
          >
            {qualified ? tc("certified") : tc("notCertified")}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${qualified ? "bg-olive" : "bg-accent"}`}
            style={{ width: `${total > 0 ? (met / total) * 100 : 0}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          {qualified ? tc("allMandatoryMet") : tc("missingMandatory", { count: outstanding })}
        </p>
      </div>
    );
  }

  const ascending = [...bands].sort((a, b) => a.minScore - b.minScore);
  const current = ascending.filter((b) => score >= b.minScore).pop() ?? null;
  const next = pointsToNextBand(score, bands);
  const percent = totalPoints > 0 ? Math.min(100, (score / totalPoints) * 100) : 0;

  return (
    <div className="rounded-2xl border border-rule bg-surface p-5">
      <div className="flex items-baseline gap-2">
        <span className="tabular font-display text-3xl font-semibold text-ink">
          {Math.round(score)}
        </span>
        <span className="tabular text-sm text-ink-faint">
          {tc("ofMarks", { total: totalPoints })}
        </span>
        <span className="ms-auto flex items-center gap-1">
          {current ? (
            Array.from({ length: current.stars }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-brass text-brass" />
            ))
          ) : (
            <span className="text-sm text-ink-faint">{tc("notClassified")}</span>
          )}
        </span>
      </div>

      {/* The rail carries a marker at each grade threshold, so the distance to
          the next star is visible as well as stated. */}
      <div className="relative mt-7 h-2 rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
        {ascending.map((band) => {
          const at = totalPoints > 0 ? (band.minScore / totalPoints) * 100 : 0;
          const reached = score >= band.minScore;
          return (
            <span
              key={band.stars}
              className="absolute -top-3.5"
              style={{ insetInlineStart: `${at}%` }}
              aria-hidden="true"
            >
              <Star
                className={`h-4 w-4 -translate-x-1/2 rtl:translate-x-1/2 transition-colors duration-300 ${
                  reached ? "fill-brass text-brass" : "text-rule"
                }`}
              />
            </span>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-ink-soft">
        {next === null
          ? tc("atTopGrade")
          : tc.rich("toNextStar", {
              needed: next.needed,
              stars: next.stars,
              b: (chunks) => <b className="font-semibold text-ink">{chunks}</b>,
            })}
      </p>
    </div>
  );
}
