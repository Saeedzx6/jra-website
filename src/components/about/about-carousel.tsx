"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export type Slide = {
  id: string;
  imageUrl: string;
  caption: string | null;
};

/**
 * The About page carousel.
 *
 * Advances on its own every six seconds, which is the behaviour the old jra.jo
 * had and what was asked for. Everything else here exists because an
 * auto-advancing carousel is one of the easiest components to get wrong.
 *
 * It stops when it should:
 *   - on hover and on keyboard focus, so a caption someone is reading does not
 *     slide away mid-sentence;
 *   - when the tab is hidden, so a background tab is not animating and
 *     repainting for nobody;
 *   - when the reader has asked for reduced motion, in which case it never
 *     starts and becomes a plain gallery they page through themselves;
 *   - and permanently, the moment someone presses a control. Taking manual
 *     charge and then having it move again on its own is the single most
 *     irritating thing this pattern does.
 *
 * Direction is expressed as previous/next rather than left/right, so the arrow
 * glyphs swap under RTL while the logic does not: `next` is always the slide
 * after this one, whichever side of the screen that appears on.
 *
 * Slides cross-fade rather than slide. A horizontal translate has a direction
 * that has to mirror in Arabic; opacity does not.
 */
const INTERVAL_MS = 6000;

export function AboutCarousel({ slides }: { slides: Slide[] }) {
  const t = useTranslations("about");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tookControl, setTookControl] = useState(false);
  const [reduced, setReduced] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  const count = slides.length;
  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const running = count > 1 && !paused && !tookControl && !reduced;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(id);
  }, [running, count]);

  // A hidden tab should not be running a timer.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Arrow keys move it, but only while it has focus — otherwise the carousel
  // hijacks arrow keys for the whole page.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setTookControl(true);
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const forward = rtl ? e.key === "ArrowLeft" : e.key === "ArrowRight";
    go(index + (forward ? 1 : -1));
  };

  if (count === 0) return null;

  const manual = (next: number) => {
    setTookControl(true);
    go(next);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("galleryLabel")}
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={regionRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-live={running ? "off" : "polite"}
        className="zoom-frame relative aspect-[21/9] overflow-hidden rounded-2xl border border-rule bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {slides.map((s, i) => (
          <div
            key={s.id}
            // Only the visible slide is exposed; the rest are inert for a
            // screen reader rather than a stack of images read in sequence.
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={s.imageUrl}
              alt={s.caption ?? ""}
              fill
              // The first is the page's largest image above the fold.
              priority={i === 0}
              sizes="(min-width: 1432px) 1432px, 100vw"
              className="object-cover"
            />
            {s.caption ? (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 pt-12 sm:p-6 sm:pt-16">
                <p className="text-sm leading-relaxed text-white sm:text-base">{s.caption}</p>
              </div>
            ) : null}
          </div>
        ))}

        {count > 1 ? (
          <>
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => manual(index - 1)}
              aria-label={t("previousSlide")}
              className="absolute start-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-ink/40 text-white backdrop-blur transition-colors hover:bg-ink/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            </button>
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => manual(index + 1)}
              aria-label={t("nextSlide")}
              className="absolute end-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-ink/40 text-white backdrop-blur transition-colors hover:bg-ink/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                suppressHydrationWarning
                key={s.id}
                type="button"
                onClick={() => manual(i)}
                aria-label={t("goToSlide", { number: i + 1 })}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  i === index ? "w-6 bg-accent" : "w-2 bg-rule hover:bg-ink-faint"
                }`}
              />
            ))}
          </div>

          {/* Only offered while it is actually capable of moving on its own.
              Under reduced motion there is nothing to pause. */}
          {!reduced ? (
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setTookControl((v) => !v)}
              aria-label={tookControl ? t("resumeAuto") : t("pauseAuto")}
              className="ms-1 flex h-7 w-7 items-center justify-center rounded-full border border-rule text-ink-faint transition-colors hover:border-ink hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {tookControl ? (
                <Play className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Pause className="h-3 w-3" aria-hidden="true" />
              )}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
