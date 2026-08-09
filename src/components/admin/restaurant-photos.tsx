"use client";

import { useTransition } from "react";
import Image from "next/image";
import { Star, Trash2, Loader2 } from "lucide-react";
import { deleteRestaurantImage, setPrimaryRestaurantImage } from "@/lib/actions/admin";

type ImageRow = { id: string; url: string; isPrimary: boolean };

export function RestaurantPhotoManager({
  restaurantId,
  images,
}: {
  restaurantId: string;
  images: ImageRow[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {images.map((img) => (
        <div key={img.id} className="group relative overflow-hidden rounded-xl border border-rule">
          <div className="relative aspect-square bg-surface-2">
            <Image src={img.url} alt="" fill className="object-cover" />
          </div>
          {img.isPrimary && (
            <span className="absolute start-1.5 top-1.5 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">
              <Star className="h-2.5 w-2.5 fill-white" /> Primary
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-ink/70 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            {!img.isPrimary && (
              <button suppressHydrationWarning
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => setPrimaryRestaurantImage(restaurantId, img.id))}
                title="Make primary"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-ink hover:bg-white"
              >
                <Star className="h-3 w-3" />
              </button>
            )}
            <button suppressHydrationWarning
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => deleteRestaurantImage(img.id))}
              title="Delete"
              className="ms-auto flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-accent-strong hover:bg-white"
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </button>
          </div>
        </div>
      ))}
      {images.length === 0 && (
        <p className="col-span-full text-sm text-ink-faint">No photos yet — add one below.</p>
      )}
    </div>
  );
}
