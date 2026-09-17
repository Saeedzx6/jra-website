"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Leaf } from "lucide-react";
import { submitSustainabilityAssessment } from "@/lib/actions/sustainability";
import { cx, ui } from "@/lib/ui";

type Result = { energyScore: number; waterScore: number; wasteScore: number; overall: number };

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-soft">{label}</span>
        <span className="tabular font-medium text-ink">{score}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-olive transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function SustainabilityCalculator({ restaurantId }: { restaurantId: string }) {
  const ts = useTranslations("sustainability");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await submitSustainabilityAssessment(restaurantId, formData);
      setResult(res);
    });
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-rule bg-surface p-6">
        <div className="flex items-center gap-2 text-olive-text">
          <Leaf className="h-5 w-5" />
          <span className="font-display text-lg font-semibold text-ink">
            {ts("overallScore", { score: result.overall })}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-faint">{ts("indicativeNote")}</p>
        <div className="mt-5 space-y-3">
          <ScoreBar label={ts("pillarEnergyTitle")} score={result.energyScore} />
          <ScoreBar label={ts("pillarWaterTitle")} score={result.waterScore} />
          <ScoreBar label={ts("pillarWasteTitle")} score={result.wasteScore} />
        </div>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4 rounded-2xl border border-rule bg-surface p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={ui.fieldLabel}>{ts("seats")}</span>
          <input
            name="seats"
            type="number"
            required
            min={1}
            defaultValue={40}
            className={cx("w-full", ui.field)}
          />
        </label>
        <label className="block">
          <span className={ui.fieldLabel}>
            {ts("monthlyElectricity")}
          </span>
          <input
            name="energyKwhMonthly"
            type="number"
            required
            min={0}
            className={cx("w-full", ui.field)}
          />
        </label>
        <label className="block">
          <span className={ui.fieldLabel}>
            {ts("monthlyWater")}
          </span>
          <input
            name="waterM3Monthly"
            type="number"
            required
            min={0}
            className={cx("w-full", ui.field)}
          />
        </label>
        <label className="block">
          <span className={ui.fieldLabel}>
            {ts("weeklyFoodWaste")}
          </span>
          <input
            name="foodWasteKgWeekly"
            type="number"
            required
            min={0}
            className={cx("w-full", ui.field)}
          />
        </label>
      </div>
      <button
        disabled={pending}
        className="pill-press rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {ts("calculateScore")}
      </button>
    </form>
  );
}
