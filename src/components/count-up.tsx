"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({
  value,
  suffix = "",
  duration = 1400,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  // Seeded with the real value, not 0, so the server-rendered HTML contains the
  // number. This used to start at 0, which meant the markup crawlers and
  // no-JS visitors received read "0+ classified members" — the animation only
  // ever filled it in client-side, after an IntersectionObserver fired.
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setDisplay(value);
      return;
    }

    // Drop to zero once we know scripting is available and the counter will be
    // animated. The stats band sits below the fold, so this happens well before
    // it is scrolled into view and is not visible as a flash.
    if (!started.current) setDisplay(0);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(1, elapsed / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(value * eased));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular">
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
