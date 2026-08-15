"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { createMarketplaceListing } from "@/lib/actions/marketplace";

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
      <select suppressHydrationWarning
        name="category"
        required
        className="w-full rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
      >
        {CATEGORY_KEYS.map((key) => (
          <option key={key} value={key}>
            {tCategory(key)}
          </option>
        ))}
      </select>
      <input suppressHydrationWarning
        name="title"
        required
        placeholder={tm("titlePlaceholder")}
        className="w-full rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
      />
      <textarea suppressHydrationWarning
        name="descriptionHtml"
        required
        rows={5}
        placeholder={tm("descriptionPlaceholder")}
        className="w-full rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <input suppressHydrationWarning
          name="price"
          type="number"
          placeholder={tm("pricePlaceholder")}
          className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <input suppressHydrationWarning
          name="contactPhone"
          placeholder={tm("contactPhonePlaceholder")}
          className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <input suppressHydrationWarning
          name="contactEmail"
          type="email"
          placeholder={tm("contactEmailPlaceholder")}
          className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <button suppressHydrationWarning
        disabled={pending}
        className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {tm("submitListing")}
      </button>
    </form>
  );
}
