"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Building2,
  Car,
  DoorOpen,
  ConciergeBell,
  UtensilsCrossed,
  ShowerHead,
  CookingPot,
  LayoutGrid,
  Coffee,
  Users,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { localized, sectionMax, sectionScore, type Section } from "./types";

/**
 * All seven documents follow the same ten-section skeleton, which is why one
 * icon set serves every standard. A section code outside this map still
 * renders — it just gets the generic clipboard rather than crashing the page.
 */
const ICONS: Record<string, LucideIcon> = {
  building: Building2,
  parking: Car,
  entrances: DoorOpen,
  service: ConciergeBell,
  hall: UtensilsCrossed,
  washrooms: ShowerHead,
  kitchen: CookingPot,
  extras: LayoutGrid,
  quality: Coffee,
  staff: Users,
};

function Ring({ percent, complete }: { percent: number; complete: boolean }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg viewBox="0 0 72 72" className="absolute inset-0 h-full w-full -rotate-90">
      <circle cx="36" cy="36" r={radius} fill="none" stroke="var(--color-surface-2)" strokeWidth="4" />
      <circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        stroke={complete ? "var(--color-olive)" : "var(--color-accent)"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - percent)}
        style={{ transition: "stroke-dashoffset 300ms ease, stroke 300ms ease" }}
      />
    </svg>
  );
}

/**
 * The checklist's front door.
 *
 * The standards run from 30 rows to well over 200, and presenting that as one
 * scroll gives an owner no way to judge how much is left or where to resume.
 * A tile per section turns it into ten short tasks, each showing its own
 * progress.
 */
export function SectionTiles({
  sections,
  answers,
  onOpen,
}: {
  sections: Section[];
  answers: Record<string, { met: boolean }>;
  onOpen: (section: Section) => void;
}) {
  const locale = useLocale();
  const tc = useTranslations("classification");

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {sections.map((section) => {
        const score = sectionScore(section, answers);
        const max = sectionMax(section);
        // Fast food's optional sections carry no marks at all. Showing those
        // as "0 / 0" reads as a broken tile, so a section with nothing to
        // score is measured in items ticked instead.
        const scored = max > 0;
        const ticked = section.criteria.filter((c) => answers[c.id]?.met).length;
        const done = scored ? score : ticked;
        const outOf = scored ? max : section.criteria.length;
        const complete = outOf > 0 && done === outOf;
        const Icon = ICONS[section.code] ?? ClipboardList;

        return (
          <li key={section.id}>
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => onOpen(section)}
              className={`flex w-full flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors ${
                complete
                  ? "border-olive/40 bg-olive-soft/40 hover:border-olive"
                  : "border-rule bg-surface hover:border-accent"
              }`}
            >
              <span className="relative h-[72px] w-[72px]">
                <Ring percent={outOf > 0 ? done / outOf : 0} complete={complete} />
                <span className="absolute inset-0 flex items-center justify-center">
                  <Icon
                    className={`h-7 w-7 ${complete ? "text-olive-text" : "text-accent"}`}
                    strokeWidth={1.6}
                  />
                </span>
              </span>
              <span className="text-sm leading-snug text-ink">
                {localized(locale, section.nameAr, section.nameEn)}
              </span>
              <span
                className={`tabular text-xs ${complete ? "font-semibold text-olive-text" : "text-ink-faint"}`}
              >
                {complete
                  ? tc("sectionComplete")
                  : scored
                    ? `${done} / ${outOf}`
                    : tc("itemsTicked", { done, total: outOf })}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
