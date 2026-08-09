"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { setListingStatus } from "@/lib/actions/marketplace";

export function MarketplaceModerationRow({
  id,
  title,
  category,
  price,
}: {
  id: string;
  title: string;
  category: string;
  price: number | null;
}) {
  const tm = useTranslations("marketplace");
  const tCategory = useTranslations("marketplace.categoryLabels");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<"PUBLISHED" | "REJECTED" | null>(null);

  if (done) {
    return (
      <div className="rounded-xl border border-rule bg-surface-2 p-4 text-ink-faint">
        {title} — {tm(`statusLabels.${done.toLowerCase()}`)}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-rule bg-surface p-4">
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-xs text-ink-faint">
          {tCategory(category)} {price ? `· ${price} JOD` : ""}
        </p>
      </div>
      <div className="flex gap-2">
        <button suppressHydrationWarning
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setListingStatus(id, "PUBLISHED");
              setDone("PUBLISHED");
            })
          }
          className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {tm("approve")}
        </button>
        <button suppressHydrationWarning
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setListingStatus(id, "REJECTED");
              setDone("REJECTED");
            })
          }
          className="rounded-full border border-rule px-4 py-1.5 text-xs font-semibold text-ink-soft disabled:opacity-60"
        >
          {tm("reject")}
        </button>
      </div>
    </div>
  );
}
