"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

/**
 * The classification "seal" — the one deliberate motion moment in the
 * product (plan §5). Fills like a certification stamp as the owner answers
 * more of the checklist; respects prefers-reduced-motion by just snapping
 * to the new value instead of animating the stroke.
 */
export function ClassificationSeal({
  percent,
  score,
  totalPoints,
  stars,
  maxStars,
}: {
  percent: number;
  score: number;
  totalPoints: number;
  stars: number;
  maxStars: number;
}) {
  const tc = useTranslations("classification");
  const [display, setDisplay] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const id = requestAnimationFrame(() => setDisplay(percent));
    return () => cancelAnimationFrame(id);
  }, [percent]);

  const offset = circumference - (display / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--color-surface-2)"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--color-brass)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular font-display text-2xl font-semibold text-ink">
            {Math.round(score)}
          </span>
          <span className="tabular text-xs text-ink-faint">/ {totalPoints}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1">
        {Array.from({ length: maxStars }).map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 transition-colors duration-500 ${
              i < stars ? "fill-brass text-brass" : "text-rule"
            }`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-ink-faint">{tc("projectedRating")}</p>
    </div>
  );
}
