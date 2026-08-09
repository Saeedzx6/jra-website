"use client";

import { useEffect, useRef } from "react";

/**
 * Wraps children that use the `.reveal` CSS class and staggers them into
 * view via IntersectionObserver as they scroll in — see plan §5 "service,
 * not spectacle" motion principle. No-op visually if JS is unavailable
 * since `.reveal` still renders (just without the fade-in).
 *
 * Pass a `resetKey` that changes whenever the underlying list changes
 * (e.g. a pagination/filter key) — client-side navigation to the same
 * route re-renders this component in place rather than remounting it, so
 * without a changing key the effect below would only ever run once and
 * every subsequent page's cards would stay invisible until a hard reload.
 */
export function RevealGroup({
  children,
  className,
  resetKey,
}: {
  children: React.ReactNode;
  className?: string;
  resetKey?: string | number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(".reveal"));

    // Content changed but the component didn't remount — clear any leftover
    // visibility state from the previous render before re-observing.
    items.forEach((item) => item.classList.remove("is-visible"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            setTimeout(() => target.classList.add("is-visible"), i * 60);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
