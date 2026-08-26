"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown } from "lucide-react";
import { criterionLabel, isDash, localized, type Criterion } from "./types";

/**
 * One row of a classification table.
 *
 * The whole row is the target — these are filled in on a phone, standing in
 * the establishment being assessed, and a 28px checkbox is not something to
 * aim at one-handed. The document's own numbering rides along so an owner can
 * find the row in the PDF when they disagree with it.
 */
export function CriterionRow({
  criterion,
  met,
  disabled,
  sharesRequirementWithPrevious,
  onToggle,
}: {
  criterion: Criterion;
  met: boolean;
  disabled?: boolean;
  /**
   * Several documents state one requirement once and then list its conditions
   * as separate scored rows — the restroom section spends six rows under a
   * single "toilets: the following conditions must be met". Rendered
   * literally, that is six identical lines to tick.
   */
  sharesRequirementWithPrevious?: boolean;
  onToggle: (met: boolean) => void;
}) {
  const locale = useLocale();
  const tc = useTranslations("classification");
  const [showDetail, setShowDetail] = useState(false);

  const detail = localized(locale, criterion.detailAr, criterion.detailEn);
  // When the requirement line is a repeat, the condition in the definition is
  // the only thing that distinguishes this row, so it becomes the label.
  const label =
    sharesRequirementWithPrevious && detail && !isDash(detail)
      ? detail
      : criterionLabel(locale, criterion);
  // The basis is already the row's label unless the document left it as a
  // dash, in which case the detail is the only explanation there is.
  const basis = localized(locale, criterion.textAr, criterion.textEn);
  const hasDetail = detail.length > 0 && !isDash(detail);

  return (
    <div className="border-t border-rule first:border-t-0">
      <button
        suppressHydrationWarning
        type="button"
        aria-pressed={met}
        disabled={disabled}
        onClick={() => onToggle(!met)}
        className="flex w-full items-center gap-3 py-3.5 text-start disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${
            met ? "border-olive bg-olive" : "border-rule bg-surface"
          }`}
        >
          <Check
            className={`h-4 w-4 text-white transition-opacity ${met ? "opacity-100" : "opacity-0"}`}
            strokeWidth={3}
          />
        </span>

        <span className="min-w-0 flex-1">
          {criterion.code ? (
            <span className="tabular me-1.5 text-xs text-ink-faint">{criterion.code}</span>
          ) : null}
          <span className={`text-sm leading-snug ${met ? "text-olive-text" : "text-ink"}`}>
            {label}
          </span>
          {criterion.mandatory ? (
            <span className="ms-2 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-strong">
              {tc("mandatory")}
            </span>
          ) : null}
        </span>

        {criterion.maxPoints > 0 ? (
          <span className="tabular shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-soft">
            {criterion.maxPoints}
          </span>
        ) : null}
      </button>

      {hasDetail && detail !== label ? (
        <div className="pb-3">
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => setShowDetail((v) => !v)}
            aria-expanded={showDetail}
            className="flex items-center gap-1 text-xs font-medium text-accent"
          >
            {tc("details")}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showDetail ? "rotate-180" : ""}`}
            />
          </button>
          {showDetail ? (
            <div className="mt-2 border-s-2 border-accent-soft ps-3 text-xs leading-relaxed text-ink-soft">
              {!isDash(basis) && basis !== label ? <p>{basis}</p> : null}
              <p className={!isDash(basis) && basis !== label ? "mt-1.5" : ""}>{detail}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
