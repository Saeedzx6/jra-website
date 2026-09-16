/**
 * How long each About-page carousel slide is held.
 *
 * These live here rather than beside the server action that uses them because
 * a `"use server"` file may only export async functions — exporting a plain
 * constant from one is a build error, not just a lint. The admin form, the
 * action that validates it, and the carousel that obeys it all read the same
 * bounds from this file, so a stale or hand-edited database value cannot spin
 * the carousel at frame rate.
 */
export const SLIDE_SECONDS_MIN = 3;
export const SLIDE_SECONDS_MAX = 20;
export const SLIDE_SECONDS_DEFAULT = 6;

/** Clamps a stored value into something a visitor would recognise as working. */
export function clampSlideSeconds(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return SLIDE_SECONDS_DEFAULT;
  return Math.min(SLIDE_SECONDS_MAX, Math.max(SLIDE_SECONDS_MIN, Math.round(value)));
}
