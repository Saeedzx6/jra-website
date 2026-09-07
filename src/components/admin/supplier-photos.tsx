"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Star, Trash2, Loader2, ImagePlus, AlertCircle } from "lucide-react";
import {
  uploadSupplierImage,
  deleteSupplierImage,
  setPrimarySupplierImage,
} from "@/lib/actions/suppliers";

type ImageRow = { id: string; url: string; isPrimary: boolean };

/**
 * Supplier gallery manager.
 *
 * Suppliers take a gallery rather than a single cover — the detail page leads
 * with the primary image and shows the rest below it — so this mirrors the
 * restaurant photo manager rather than the one-image CoverImageField.
 *
 * Upload errors are returned by the action and shown inline; the file input is
 * remounted after a success so the previous selection does not linger and look
 * like a pending upload.
 */
export function SupplierPhotoManager({
  supplierId,
  images,
}: {
  supplierId: string;
  images: ImageRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  function upload(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await uploadSupplierImage(supplierId, formData);
      if (result.error) setError(result.error);
      else setFormKey((k) => k + 1);
    });
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative overflow-hidden rounded-xl border border-rule"
          >
            <div className="relative aspect-square bg-surface-2">
              <Image src={img.url} alt="" fill sizes="160px" className="object-cover" />
            </div>
            {img.isPrimary ? (
              <span className="absolute start-1.5 top-1.5 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">
                <Star className="h-2.5 w-2.5 fill-white" aria-hidden="true" /> Primary
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-ink/70 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {!img.isPrimary ? (
                <button
                  suppressHydrationWarning
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() => setPrimarySupplierImage(supplierId, img.id))
                  }
                  title="Make primary"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-ink hover:bg-white"
                >
                  <Star className="h-3 w-3" aria-hidden="true" />
                  <span className="sr-only">Make primary</span>
                </button>
              ) : null}
              <button
                suppressHydrationWarning
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => deleteSupplierImage(img.id))}
                title="Delete"
                className="ms-auto flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-accent-strong hover:bg-white"
              >
                {pending ? (
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                )}
                <span className="sr-only">Delete photo</span>
              </button>
            </div>
          </div>
        ))}
        {images.length === 0 ? (
          <p className="col-span-full text-sm text-ink-faint">
            No photos yet — the first one you add becomes the directory card image.
          </p>
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
        <button
          suppressHydrationWarning
          type="submit"
          disabled={pending}
          className="pill-press inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
          Add photo
        </button>
      </form>

      <p aria-live="polite" className="mt-2 min-h-4 text-xs">
        {pending ? <span className="text-ink-faint">Working…</span> : null}
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
