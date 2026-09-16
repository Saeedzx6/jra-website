import { describe, expect, it } from "vitest";
import {
  clampSlideSeconds,
  SLIDE_SECONDS_DEFAULT,
  SLIDE_SECONDS_MAX,
  SLIDE_SECONDS_MIN,
} from "./about-timing";

/**
 * The value reaches the carousel from a database column an admin types into,
 * so every shape a column can hold has to land somewhere sensible.
 */
describe("clampSlideSeconds", () => {
  it("keeps a value that is already in range", () => {
    expect(clampSlideSeconds(8)).toBe(8);
  });

  it("falls back to the default when nothing is set", () => {
    expect(clampSlideSeconds(null)).toBe(SLIDE_SECONDS_DEFAULT);
    expect(clampSlideSeconds(undefined)).toBe(SLIDE_SECONDS_DEFAULT);
    expect(clampSlideSeconds(Number.NaN)).toBe(SLIDE_SECONDS_DEFAULT);
  });

  it("refuses to spin the carousel at frame rate", () => {
    // 0 would be an interval of 0ms.
    expect(clampSlideSeconds(0)).toBe(SLIDE_SECONDS_MIN);
    expect(clampSlideSeconds(-5)).toBe(SLIDE_SECONDS_MIN);
  });

  it("refuses a wait so long the carousel reads as broken", () => {
    expect(clampSlideSeconds(9999)).toBe(SLIDE_SECONDS_MAX);
  });

  it("rounds a fractional value to whole seconds", () => {
    expect(clampSlideSeconds(7.4)).toBe(7);
  });
});
