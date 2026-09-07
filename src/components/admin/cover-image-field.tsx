"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ImagePlus, Trash2, AlertCircle } from "lucide-react";
import { setCoverImage, clearCoverImage, type MediaTarget } from "@/lib/actions/media";

/**
 * Cover-image control for the admin back office.
 *
 * One component for every content type: pass the target and the record id and
 * it handles preview, upload, replace and remove. Adding a new image-bearing
 * model means adding a case to `media.ts`, not writing this UI again.
 *
 * The file input is uncontrolled and reset after a successful upload — leaving
 * the previous selection in place makes it look like the upload is still
 * pending.
 */
export function CoverImageField({
  target,
  id,
  currentUrl,
  label,
  hint,
}: {
  target: MediaTarget;
  id: string;
  currentUrl: string | null;
  label: string;
  hint?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  function upload(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await setCoverImage(target, id, formData);
      if (result.error) setError(result.error);
      else setFormKey((k) => k + 1);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await clearCoverImage(target, id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-xl border border-rule bg-paper p-4">
      <p className="text-xs font-semibold text-ink">{label}</p>
      {hint ? <p className="mt-1 text-xs text-ink-faint">{hint}</p> : null}

      <div className="mt-3 flex items-start gap-4">
        <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-rule bg-surface-2">
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-[11px] text-ink-faint">
              No image
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <form key={formKey} action={upload} className="flex flex-wrap items-center gap-2">
            <input
              suppressHydrationWarning
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              required
              className="min-w-0 flex-1 text-xs text-ink-soft file:me-3 file:rounded-full file:border file:border-rule file:bg-surface file:px-3 file:py-1.5 file:text-xs file:text-ink hover:file:border-ink"
            />
            <button
              suppressHydrationWarning
              type="submit"
              disabled={pending}
              className="pill-press inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
              {currentUrl ? "Replace" : "Upload"}
            </button>
            {currentUrl ? (
              <button
                suppressHydrationWarning
                type="button"
                onClick={remove}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-full border border-rule px-4 py-2 text-xs font-medium text-ink-soft hover:border-danger hover:text-danger-text disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Remove
              </button>
            ) : null}
          </form>

          {/* aria-live so the error reaches a screen reader: the upload is a
              transition, and nothing else about the page moves focus. */}
          <p aria-live="polite" className="mt-2 min-h-4 text-xs">
            {pending ? <span className="text-ink-faint">Uploading…</span> : null}
            {error ? (
              <span className="inline-flex items-center gap-1 text-danger-text">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {error}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}
