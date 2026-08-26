"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import { heroVideo } from "@/lib/hero-media";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false, // server snapshot
  );
}

/**
 * Full-bleed hero background video.
 *
 * The reduced-motion handling is the reason this is a component rather than a
 * bare <video> tag. CSS cannot stop a video from autoplaying — a
 * prefers-reduced-motion media query can disable transitions and animations,
 * but an autoplaying looped clip keeps running. So the preference is read in
 * JS and the <video> is simply never rendered when motion is unwanted; the
 * poster frame is shown as a still image instead. That also means those users
 * never pay for the download.
 *
 * The video itself:
 *  - muted + playsInline, or iOS refuses to autoplay and shows a play button
 *  - poster carries the first paint, so the LCP does not wait on video bytes
 *  - preload="metadata" rather than "auto": the clip is decorative and should
 *    not compete with the search console for bandwidth
 *  - aria-hidden and no captions: it is decoration with no audio and no
 *    information of its own. All hero meaning is in the text above it.
 */
export function HeroVideo() {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return (
      <Image
        src={heroVideo.poster}
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover" }}
      />
    );
  }

  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={heroVideo.poster}
      aria-hidden="true"
      tabIndex={-1}
    >
      {heroVideo.sources.map((source) =>
        source.media ? (
          <source key={source.src} src={source.src} type={source.type} media={source.media} />
        ) : (
          <source key={source.src} src={source.src} type={source.type} />
        ),
      )}
    </video>
  );
}
