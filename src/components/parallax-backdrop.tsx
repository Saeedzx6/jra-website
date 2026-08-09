"use client";

import { useEffect, useRef } from "react";

/**
 * Translates its children slower than the page scrolls, so the foreground
 * cards appear to float above the scenic layer.
 *
 * Transform-only and rAF-throttled — a scroll handler that writes layout
 * properties is the usual source of parallax jank. Opts out entirely under
 * prefers-reduced-motion, where a moving backdrop is disorienting rather
 * than atmospheric.
 */
export function ParallaxBackdrop({
  children,
  speed = 0.18,
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    function update() {
      frame = 0;
      const node = ref.current;
      if (!node) return;
      node.style.transform = `translate3d(0, ${window.scrollY * speed}px, 0)`;
    }
    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [speed]);

  return (
    <div ref={ref} className={`parallax-layer ${className}`}>
      {children}
    </div>
  );
}
