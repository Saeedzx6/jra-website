"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { submitProfileEditRequest } from "@/lib/actions/admin";

export function SuggestEditForm({
  restaurantId,
  userId,
  currentShortDescription,
}: {
  restaurantId: string;
  userId: string;
  currentShortDescription: string;
}) {
  const tp = useTranslations("portal");
  const [value, setValue] = useState(currentShortDescription);
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-olive">
        <Check className="h-4 w-4" /> {tp("sentForApproval")}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea suppressHydrationWarning
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
      <button suppressHydrationWarning
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await submitProfileEditRequest(restaurantId, userId, { shortDescription: value });
            setSent(true);
          })
        }
        className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        {tp("suggestThisUpdate")}
      </button>
    </div>
  );
}
