"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { createMarketplaceListing } from "@/lib/actions/marketplace";
import { cx, ui } from "@/lib/ui";

const CATEGORY_KEYS = [
  "RESTAURANT_FOR_SALE",
  "EQUIPMENT_SALE",
  "EQUIPMENT_RENT",
  "INVESTMENT_OPPORTUNITY",
] as const;

export function ListingForm() {
  const tm = useTranslations("marketplace");
  const tCategory = useTranslations("marketplace.categoryLabels");
  const [state, formAction, pending] = useActionState(createMarketplaceListing, { ok: false });

  if (state.ok) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-olive-soft p-4 text-olive-text">
        <Check className="h-5 w-5" />
        <span>{tm("listingSubmitted")}</span>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <select
        name="category"
        required
        className={cx("w-full", ui.fieldOnPaper)}
      >
        {CATEGORY_KEYS.map((key) => (
          <option key={key} value={key}>
            {tCategory(key)}
          </option>
        ))}
      </select>
      <input
        name="title"
        required
        placeholder={tm("titlePlaceholder")}
        className={cx("w-full", ui.fieldOnPaper)}
      />
      <textarea
        name="descriptionHtml"
        required
        rows={5}
        placeholder={tm("descriptionPlaceholder")}
        className={cx("w-full", ui.fieldOnPaper)}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <input
          name="price"
          type="number"
          placeholder={tm("pricePlaceholder")}
          className={ui.fieldOnPaper}
        />
        <input
          name="contactPhone"
          placeholder={tm("contactPhonePlaceholder")}
          className={ui.fieldOnPaper}
        />
        <input
          name="contactEmail"
          type="email"
          placeholder={tm("contactEmailPlaceholder")}
          className={ui.fieldOnPaper}
        />
      </div>
      <button
        disabled={pending}
        className="pill-press rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? <Loader2 className="me-1.5 inline h-3.5 w-3.5 animate-spin align-[-2px]" aria-hidden="true" /> : null}
        {tm("submitListing")}
      </button>
    </form>
  );
}
