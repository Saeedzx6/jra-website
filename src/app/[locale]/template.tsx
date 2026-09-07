"use client";

/**
 * Route transition.
 *
 * A template remounts on every navigation (unlike a layout), which is what
 * makes a crossfade possible without any router plumbing.
 *
 * Opacity only, and deliberately so: a slide has a direction, and direction
 * has to mirror under RTL. Every slide transition on a bilingual site is two
 * transitions plus a bug waiting to happen. A fade reads identically in both
 * scripts.
 *
 * 200ms, `both` fill so the first frame is not a flash of the incoming page
 * at full opacity. Under `prefers-reduced-motion` the universal rule in
 * globals.css collapses the duration and the content lands immediately.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="route-fade">{children}</div>;
}
