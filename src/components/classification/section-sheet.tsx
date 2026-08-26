"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Info, X } from "lucide-react";
import { CriterionRow } from "./criterion-row";
import { localized, sectionMax, sectionScore, type Section } from "./types";

/**
 * One section's rows, in a sheet over the tiles.
 *
 * Built on <dialog> so the focus trap, the Escape handler and the inert
 * background come from the platform rather than from hand-rolled key
 * listeners. The rows are grouped under the document's own الوصف العام
 * headings, because the standards use that grouping to say which requirements
 * belong together — several rows often share one heading and read as
 * nonsense apart from it.
 */
export function SectionSheet({
  section,
  answers,
  readOnly,
  onToggle,
  onClose,
}: {
  section: Section | null;
  answers: Record<string, { met: boolean }>;
  readOnly?: boolean;
  onToggle: (criterionId: string, met: boolean) => void;
  onClose: () => void;
}) {
  const locale = useLocale();
  const tc = useTranslations("classification");
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (section && !el.open) el.showModal();
    if (!section && el.open) el.close();
  }, [section]);

  if (!section) {
    return <dialog ref={ref} className="hidden" />;
  }

  const score = sectionScore(section, answers);
  const max = sectionMax(section);
  const sectionNote = localized(locale, section.noteAr, section.noteEn);

  // A heading is only worth printing when it says something the row itself
  // does not, and only once per run of rows that share it.
  let lastGroup: string | null = null;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // A click on the dialog element itself is a click on the backdrop;
        // clicks on the content stop at the inner wrapper.
        if (e.target === ref.current) onClose();
      }}
      className="m-0 max-h-[85dvh] w-full max-w-[640px] rounded-t-2xl bg-surface p-0 text-ink backdrop:bg-ink/40 sm:mx-auto sm:my-auto sm:rounded-2xl mt-auto"
    >
      <div className="flex max-h-[85dvh] flex-col">
        <div className="flex items-center gap-3 border-b border-rule px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-ink">
              {localized(locale, section.nameAr, section.nameEn)}
            </h2>
            <p className="tabular text-sm text-ink-faint">
              {tc("sectionScore", { score, max })}
            </p>
          </div>
          <button
            suppressHydrationWarning
            type="button"
            onClick={onClose}
            aria-label={tc("close")}
            className="ms-auto grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5">
          {/* A section-level note can waive the whole section — the restaurant
              standard excuses its kitchen for venues that need none — so it
              belongs above the rows it governs, not buried under them. */}
          {sectionNote ? (
            <p className="mt-4 flex gap-2 rounded-lg bg-brass-soft px-3 py-2.5 text-xs leading-relaxed text-brass-text">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {sectionNote}
            </p>
          ) : null}

          {section.criteria.map((criterion, index) => {
            const group = localized(locale, criterion.groupAr, criterion.groupEn);
            const sectionName = localized(locale, section.nameAr, section.nameEn);
            const showGroup = group.length > 0 && group !== lastGroup && group !== sectionName;
            if (group.length > 0) lastGroup = group;

            const previous = section.criteria[index - 1];
            const repeats =
              !!previous &&
              localized(locale, previous.textAr, previous.textEn) ===
                localized(locale, criterion.textAr, criterion.textEn);

            return (
              <div key={criterion.id}>
                {showGroup ? (
                  <p className="mt-4 rounded-lg bg-accent-soft px-3 py-2 text-xs font-medium text-accent-strong">
                    {group}
                  </p>
                ) : null}
                <CriterionRow
                  criterion={criterion}
                  met={answers[criterion.id]?.met ?? false}
                  disabled={readOnly}
                  sharesRequirementWithPrevious={repeats}
                  onToggle={(met) => onToggle(criterion.id, met)}
                />
              </div>
            );
          })}

          <button
            suppressHydrationWarning
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white"
          >
            {tc("done")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
