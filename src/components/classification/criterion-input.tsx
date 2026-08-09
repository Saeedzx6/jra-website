"use client";

import { useTranslations } from "next-intl";
import { CircleSlash } from "lucide-react";
import type { CriterionValue } from "@/lib/classification-scoring";

export function CriterionInput({
  label,
  points,
  value,
  onChange,
}: {
  label: string;
  points: number;
  value: CriterionValue | undefined;
  onChange: (value: CriterionValue) => void;
}) {
  const tc = useTranslations("classification");
  const rating = value?.rating ?? 0;
  const dontHave = value?.dontHave ?? false;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-[220px] flex-1">
        <p className="text-sm text-ink">{label}</p>
        <p className="tabular text-xs text-ink-faint">
          {points} {tc("pts")}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 ${dontHave ? "opacity-40" : ""}`}>
          <input suppressHydrationWarning
            type="range"
            min={0}
            max={10}
            step={1}
            value={rating}
            disabled={dontHave}
            onChange={(e) => onChange({ rating: Number(e.target.value), dontHave: false })}
            className="w-32 shrink-0 disabled:cursor-not-allowed sm:w-40"
            aria-label={`${tc("rateLabel")}: ${label}`}
          />
          <span className="tabular flex h-7 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">
            {dontHave ? "–" : rating}
          </span>
        </div>

        <button suppressHydrationWarning
          type="button"
          onClick={() => onChange({ rating: 0, dontHave: !dontHave })}
          aria-pressed={dontHave}
          title={tc("dontHaveThis")}
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
            dontHave
              ? "border-ink-faint bg-ink-faint/20 text-ink-soft"
              : "border-rule text-ink-faint hover:border-ink-faint hover:text-ink-soft"
          }`}
        >
          <CircleSlash className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
