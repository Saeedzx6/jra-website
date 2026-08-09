"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Paperclip } from "lucide-react";
import { submitMembershipApplication } from "@/lib/actions/membership";

export function MembershipForm() {
  const tf = useTranslations("membershipForm");
  const [state, formAction, pending] = useActionState(submitMembershipApplication, {
    ok: false,
  });
  const [type, setType] = useState<"ACTIVE_RESTAURANT" | "ASSOCIATE_SUPPLIER">(
    "ACTIVE_RESTAURANT"
  );

  if (state.ok) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-olive-soft p-4 text-olive">
        <Check className="h-5 w-5" />
        <span>{tf("received")}</span>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-full border border-rule bg-surface p-1">
        {(
          [
            ["ACTIVE_RESTAURANT", tf("restaurantVenue")],
            ["ASSOCIATE_SUPPLIER", tf("supplier")],
          ] as const
        ).map(([value, label]) => (
          <button suppressHydrationWarning
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              type === value ? "bg-accent text-white" : "text-ink-soft hover:bg-surface-2"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <input suppressHydrationWarning type="hidden" name="applicantType" value={type} />

      <div className="grid gap-4 sm:grid-cols-2">
        <input suppressHydrationWarning
          name="businessName"
          required
          placeholder={type === "ACTIVE_RESTAURANT" ? tf("restaurantNamePlaceholder") : tf("companyNamePlaceholder")}
          className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <input suppressHydrationWarning
          name="contactName"
          required
          placeholder={tf("contactPersonPlaceholder")}
          className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <input suppressHydrationWarning
          name="email"
          type="email"
          required
          placeholder={tf("emailPlaceholder")}
          className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <input suppressHydrationWarning
          name="phone"
          required
          placeholder={tf("phonePlaceholder")}
          className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      {type === "ACTIVE_RESTAURANT" && (
        <input suppressHydrationWarning
          name="classificationClaim"
          placeholder={tf("classificationClaimPlaceholder")}
          className="w-full rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      )}

      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink-soft">
          <Paperclip className="h-4 w-4" />
          {tf("supportingDocuments")} <span className="text-ink-faint">{tf("optional")}</span>
        </span>
        <input
          suppressHydrationWarning
          type="file"
          name="documents"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
          className="w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-accent-strong"
        />
        <span className="mt-1 block text-xs text-ink-faint">{tf("documentsHint")}</span>
      </label>

      <button suppressHydrationWarning
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto"
      >
        {tf("submitApplication")}
      </button>
    </form>
  );
}
