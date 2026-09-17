"use client";
import { cx, ui } from "@/lib/ui";

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
      <div className="mt-3 flex items-center gap-2 text-sm text-olive-text">
        <Check className="h-4 w-4" /> {tp("sentForApproval")}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        className={cx("w-full", ui.fieldCompact)}
      />
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await submitProfileEditRequest(restaurantId, userId, { shortDescription: value });
            setSent(true);
          })
        }
        className="pill-press rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        {tp("suggestThisUpdate")}
      </button>
    </div>
  );
}
