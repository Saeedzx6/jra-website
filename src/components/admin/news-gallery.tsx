"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Trash2, Loader2, ImagePlus, AlertCircle } from "lucide-react";
import { uploadNewsGalleryImage, deleteNewsGalleryImage } from "@/lib/actions/media";
import { prepareImage, UPLOAD_MAX_BYTES, tooLargeMessage } from "@/lib/prepare-image";

type GalleryRow = { id: string; imageUrl: string; caption: string | null };

/**
 * Extra photos for a news article, beyond its cover.
 *
 * Captions are optional and stored per image. They double as the alt text on
 * the public page — an editor writing "Signing the MoU with the Ministry of
 * Tourism" is writing a better description than any fallback could generate,
 * and asking for the same sentence twice guarantees one of them goes stale.
 */
export function NewsGalleryManager({
  articleId,
  items,
  labels,
}: {
  articleId: string;
  items: GalleryRow[];
  labels: { heading: string; add: string; caption: string; empty: string };
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  function upload(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        // Resize before sending. A phone photo is far larger than a server
        // action's request body can carry, and that failure arrives as a
        // platform 413 that no code of ours can turn into a message.
        const picked = formData.get("file");
        if (picked instanceof File && picked.size > 0) {
          const prepared = await prepareImage(picked);
          if (prepared.size > UPLOAD_MAX_BYTES) {
            setError(tooLargeMessage(prepared.size));
            return;
          }
          formData.set("file", prepared, prepared.name);
        }

        const result = await uploadNewsGalleryImage(articleId, formData);
        if (result.error) setError(result.error);
        else setFormKey((k) => k + 1);
      } catch {
        // Without this the rejected action reaches the segment's error
        // boundary and replaces the whole page with "Something went wrong".
        setError("The upload did not complete. Please try again.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-rule bg-paper p-4">
      <p className="text-xs font-semibold text-ink">{labels.heading}</p>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <figure
            key={item.id}
            className="group relative overflow-hidden rounded-xl border border-rule"
          >
            <div className="relative aspect-square bg-surface-2">
              <Image
                src={item.imageUrl}
                alt={item.caption ?? ""}
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
            {item.caption ? (
              <figcaption className="line-clamp-2 px-2 py-1.5 text-[11px] leading-snug text-ink-soft">
                {item.caption}
              </figcaption>
            ) : null}
            <button
              suppressHydrationWarning
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => deleteNewsGalleryImage(item.id))}
              className="absolute end-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-accent-strong opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
            >
              {pending ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              )}
              <span className="sr-only">Delete photo</span>
            </button>
          </figure>
        ))}
        {items.length === 0 ? (
          <p className="col-span-full text-xs text-ink-faint">{labels.empty}</p>
        ) : null}
      </div>

      <form key={formKey} action={upload} className="mt-3 flex flex-wrap items-center gap-2">
        <input
          suppressHydrationWarning
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          required
          className="min-w-0 flex-1 text-xs text-ink-soft file:me-3 file:rounded-full file:border file:border-rule file:bg-surface file:px-3 file:py-1.5 file:text-xs file:text-ink hover:file:border-ink"
        />
        <input
          suppressHydrationWarning
          type="text"
          name="caption"
          placeholder={labels.caption}
          className="min-w-0 flex-1 rounded-full border border-rule bg-surface px-4 py-1.5 text-xs focus:border-accent focus:outline-none"
        />
        <button
          suppressHydrationWarning
          type="submit"
          disabled={pending}
          className="pill-press inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
          {labels.add}
        </button>
      </form>

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
  );
}
