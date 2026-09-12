import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { UPLOAD_MAX_BYTES, tooLargeMessage } from "./prepare-image";

/**
 * The bug this guards against
 * --------------------------
 * Next caps a server action's request body at 1 MB by default. Every photo a
 * phone takes is larger than that, so every upload in the back office failed —
 * and it failed as a platform 413 raised *before* the action ran, which meant
 * the size check inside the action never executed and the browser showed the
 * segment's error boundary ("Something went wrong at our end") instead of a
 * message.
 *
 * Two numbers have to stay in the right order for uploads to work at all:
 * the ceiling the app enforces must sit below the ceiling the platform
 * enforces. These tests fail if either drifts.
 */

function configuredBodyLimitBytes(): number {
  const src = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
  const match = src.match(/bodySizeLimit:\s*"(\d+(?:\.\d+)?)(mb|kb)"/i);
  const amount = match?.[1];
  const unit = match?.[2];
  if (!amount || !unit) throw new Error("bodySizeLimit is not set in next.config.ts");
  const value = Number(amount);
  return unit.toLowerCase() === "mb" ? value * 1024 * 1024 : value * 1024;
}

describe("upload size ceilings", () => {
  it("raises the server action body limit above Next's 1 MB default", () => {
    // Without this, uploads are broken for essentially every real photograph.
    expect(configuredBodyLimitBytes()).toBeGreaterThan(1024 * 1024);
  });

  it("keeps the app's own ceiling below the platform's", () => {
    // If the app allowed more than the transport does, the rejection would
    // come from the platform as a 413 again, with no message we can shape.
    expect(UPLOAD_MAX_BYTES).toBeLessThanOrEqual(configuredBodyLimitBytes());
  });

  it("stays under Vercel's 4.5 MB serverless request cap", () => {
    // A larger number here would only move the failure to their platform.
    expect(configuredBodyLimitBytes()).toBeLessThanOrEqual(4.5 * 1024 * 1024);
  });

  it("reports the actual size, so the message is actionable", () => {
    expect(tooLargeMessage(6 * 1024 * 1024)).toContain("6.0 MB");
  });
});
