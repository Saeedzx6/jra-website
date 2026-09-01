"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFormatter } from "next-intl";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Reads the motion preference as an external store rather than copying it into
 * state inside an effect. That keeps it a derived value — no cascading render —
 * and it stays correct if the preference changes while the page is open. The
 * server snapshot is `false` so SSR and first client render agree.
 */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

export type Stat = {
  value: number;
  suffix?: string;
  decimals?: number;
  label: string;
};

/**
 * Counters animate once on entry. Two accessibility notes:
 *  - prefers-reduced-motion shows the final figure immediately.
 *  - The animated text is aria-hidden and the final value is exposed to
 *    screen readers separately, so assistive tech never announces a stream of
 *    intermediate numbers.
 */
export function Stats({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const [inView, setInView] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <ul ref={ref}>
      {stats.map((stat) => (
        <li key={stat.label}>
          <Counter
            value={stat.value}
            suffix={stat.suffix ?? ""}
            decimals={stat.decimals ?? 0}
            run={inView}
            reduced={reduced}
          />
          <span className="label">{stat.label}</span>
        </li>
      ))}
    </ul>
  );
}

function Counter({
  value,
  suffix,
  decimals,
  run,
  reduced,
}: {
  value: number;
  suffix: string;
  decimals: number;
  run: boolean;
  reduced: boolean;
}) {
  const [animated, setAnimated] = useState(0);
  /**
   * next-intl's formatter, not `toLocaleString(locale)`.
   *
   * They disagree: `toLocaleString("ar-JO")` selects the arab numbering system
   * and renders ٧١٨, while everything routed through next-intl renders 718.
   * One page showing both is the kind of detail that makes a bilingual build
   * look unfinished. One formatter, one numbering system.
   */
  const format = useFormatter();

  useEffect(() => {
    if (!run || reduced) return;

    const duration = 1400;
    const start = performance.now();
    let frame = 0;

    // setState happens inside the rAF callback, never synchronously in the
    // effect body, so this drives one animation rather than a render cascade.
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setAnimated(value * (1 - Math.pow(1 - progress, 3))); // ease-out cubic
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [run, reduced, value]);

  const shown = reduced ? value : animated;

  const render = (n: number) =>
    format.number(n, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  return (
    <>
      <span className="num" aria-hidden="true">
        {render(shown)}
        {suffix && <span className="suffix">{suffix}</span>}
      </span>
      <span className="sr-only">
        {render(value)}
        {suffix}
      </span>
    </>
  );
}
