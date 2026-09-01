"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * Horizontal scroller. The list scrolls natively; the arrows only nudge it, so
 * touch, trackpad and keyboard all work without them.
 *
 * RTL note: scrollLeft runs negative in right-to-left documents, so the step
 * sign follows the resolved document direction rather than assuming LTR.
 */
export function Rail({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  const ref = useRef<HTMLUListElement>(null);

  function nudge(direction: 1 | -1) {
    const node = ref.current;
    if (!node) return;

    const first = node.firstElementChild as HTMLElement | null;
    const step = (first?.offsetWidth ?? 320) + 24;
    const rtl = getComputedStyle(node).direction === "rtl";
    node.scrollBy({ left: step * direction * (rtl ? -1 : 1), behavior: "smooth" });
  }

  return (
    <>
      <ul className="rail" ref={ref}>
        {children}
      </ul>

      <div className="flow-row" style={{ justifyContent: "flex-end" }}>
        <button
          type="button"
          className="icon-btn"
          aria-label={t("previous")}
          onClick={() => nudge(-1)}
        >
          <Chevron direction="start" />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={t("next")}
          onClick={() => nudge(1)}
        >
          <Chevron direction="end" />
        </button>
      </div>
    </>
  );
}

function Chevron({ direction }: { direction: "start" | "end" }) {
  return (
    <svg
      className="mirror"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={direction === "end" ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
