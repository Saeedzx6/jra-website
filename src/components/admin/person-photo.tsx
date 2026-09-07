"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ImagePlus, Trash2, AlertCircle } from "lucide-react";
import { setPersonPhoto, clearPersonPhoto } from "@/lib/actions/people";

/**
 * Headshot control for a board member or staff entry.
 *
 * Separate from CoverImageField because the shape is different: this one is a
 * square portrait shown at small size on the About page, so it previews as a
 * circle to match how it will actually be seen.
 */
export function PersonPhotoField({
  id,
  currentUrl,
  name,
  labels,
}: {
  id: string;
  currentUrl: string | null;
  name: string;
  labels: { upload: string; replace: string; remove: string; none: string };
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  function upload(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await setPersonPhoto(id, formData);
      if (result.error) setError(result.error);
      else setFormKey((k) => k + 1);
    });
  }

  return (
    <div className="flex items-start gap-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-rule bg-surface-2">
        {currentUrl ? (
          <Image src={currentUrl} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center font-display text-xl text-ink/25">
            {name.trim().charAt(0) || "·"}
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
            {currentUrl ? labels.replace : labels.upload}
          </button>
          {currentUrl ? (
            <button
              suppressHydrationWarning
              type="button"
              disabled={pending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await clearPersonPhoto(id);
                  if (result.error) setError(result.error);
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-rule px-4 py-2 text-xs font-medium text-ink-soft hover:border-danger hover:text-danger-text disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {labels.remove}
            </button>
          ) : null}
        </form>

        <p aria-live="polite" className="mt-2 min-h-4 text-xs">
          {pending ? <span className="text-ink-faint">Uploading…</span> : null}
          {error ? (
            <span className="inline-flex items-center gap-1 text-danger-text">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {error}
            </span>
          ) : null}
          {!pending && !error && !currentUrl ? (
            <span className="text-ink-faint">{labels.none}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
