"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Site-wide scroll reveal.
 *
 * `.reveal` and its transition already existed, but the only thing that could
 * switch elements on was <RevealGroup>, a wrapper each grid had to opt into.
 * Two pages did. Everywhere else the class was unused and the motion system
 * simply did not run — ten public pages with card grids and nothing moving.
 *
 * Mounting one observer in the layout inverts that: markup asks for motion by
 * carrying the class, and nothing has to be restructured to get it. RevealGroup
 * stays for paginated lists, where it also has to clear state when the list
 * changes under a component that never remounts; both only ever add
 * `is-visible`, so they cannot fight.
 *
 * Elements are revealed in document order with a small stagger, capped so a
 * long grid does not leave its last card waiting seconds to appear.
 */
const STAGGER_MS = 60;
const MAX_STAGGER_MS = 420;

export function RevealOnScroll() {
  // Client navigation swaps the tree without remounting this, so the observer
  // is rebuilt per route — otherwise the next page's cards never register.
  const pathname = usePathname();

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    // Opt the document into the hidden state only now that this effect is
    // running — see the note on .js-reveal in globals.css.
    const root = document.documentElement;
    root.classList.add("js-reveal");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));

    // With reduced motion the CSS already neutralises the transition; showing
    // everything at once avoids leaving anything stuck at opacity 0.
    if (reduced) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    // Anything already on screen at load should not fade in — it was never
    // "revealed", it was just there.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const siblings = el.parentElement
            ? Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"))
            : [el];
          const index = siblings.indexOf(el);
          el.style.transitionDelay = `${Math.min(index * STAGGER_MS, MAX_STAGGER_MS)}ms`;
          el.classList.add("is-visible");
          observer.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    items.forEach((el) => {
      if (!el.classList.contains("is-visible")) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
