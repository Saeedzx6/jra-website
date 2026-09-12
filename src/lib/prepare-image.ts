/**
 * Downscales an image in the browser before it is sent to a server action.
 *
 * Why this exists: a photo off a phone is routinely 3–12 MB, and a Next server
 * action's request body is capped — 1 MB by default, and Vercel will not carry
 * more than 4.5 MB to a serverless function whatever we configure. Uploading
 * the original was therefore guaranteed to fail for most real photographs, and
 * it failed as a 413 raised by the platform before any of our code ran, so the
 * size check inside the action never had a chance to produce a message.
 *
 * Resizing here fixes the cause rather than the symptom, and is faster for the
 * person uploading: a 12 MB camera JPEG becomes roughly 300–600 KB with no
 * visible difference at the sizes the site actually renders (the largest use is
 * a 1432px-wide hero crop).
 *
 * Everything is done on a canvas with no network access and no dependencies.
 *
 * Deliberate limits:
 *   - GIFs pass through untouched. Drawing one to a canvas keeps the first
 *     frame and silently destroys the animation.
 *   - Anything already small enough passes through untouched, so a carefully
 *     prepared asset is never re-encoded and softened.
 *   - If anything fails — a decode error, a tainted canvas, no canvas support
 *     — the original file is returned and the server's own limit reports it.
 *     A failure to optimise must never become a failure to upload.
 */

/** Longest edge, in px. Comfortably above the largest rendered size. */
const MAX_EDGE = 2200;

/** Files at or under this are already fine; re-encoding would only lose detail. */
const SKIP_BELOW_BYTES = 900 * 1024;

/** Ceiling the result must fit under, matching the server action's own limit. */
const TARGET_MAX_BYTES = 3.5 * 1024 * 1024;

const QUALITY_STEPS = [0.85, 0.72, 0.6, 0.45];

function loadBitmap(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image"));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function prepareImage(file: File): Promise<File> {
  try {
    if (typeof document === "undefined") return file;
    // Animation would not survive a canvas round-trip.
    if (file.type === "image/gif") return file;
    if (!file.type.startsWith("image/")) return file;
    if (file.size <= SKIP_BELOW_BYTES) return file;

    const img = await loadBitmap(file);
    const { naturalWidth: w, naturalHeight: h } = img;
    if (!w || !h) return file;

    const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Step the quality down only as far as needed to clear the ceiling, so a
    // photo that fits at 0.85 is never flattened to 0.45 for no reason.
    for (const quality of QUALITY_STEPS) {
      const blob = await toBlob(canvas, quality);
      if (!blob) break;
      if (blob.size <= TARGET_MAX_BYTES || quality === QUALITY_STEPS[QUALITY_STEPS.length - 1]) {
        // Never hand back something larger than what we were given.
        if (blob.size >= file.size) return file;
        const base = file.name.replace(/\.[^.]+$/, "");
        return new File([blob], `${base}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }
    }
    return file;
  } catch {
    // Optimisation is a convenience. If it breaks, send the original and let
    // the server's limit produce a proper message.
    return file;
  }
}

/** Shared ceiling, so the client message and the server check cannot drift. */
export const UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

export function tooLargeMessage(bytes: number) {
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  return `That image is ${mb} MB, which is still too large after resizing. Please crop it or save a smaller copy.`;
}
