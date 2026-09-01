"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Check, Send } from "lucide-react";
import { submitMembershipApplication } from "@/lib/actions/membership";

export type AssessmentPayload = {
  establishmentType: string;
  score: number;
  totalPoints: number;
  stars: number;
  sections: { name: string; score: number; max: number }[];
};

export function SubmitAssessmentForm({ payload }: { payload: AssessmentPayload }) {
  const tc = useTranslations("classification");
  const [state, formAction, pending] = useActionState(submitMembershipApplication, {
    ok: false,
  });

  if (state.ok) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-success-soft p-3 text-sm text-success-text">
        <Check className="h-4 w-4 shrink-0" />
        {tc("sentToJra")}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-4 space-y-2 rounded-xl border border-rule bg-surface p-4">
      {/* Membership class — every hospitality venue joins as an active member;
          only suppliers differ. The establishment type below is the separate
          thing that decides which fee row applies. */}
      <input type="hidden" name="applicantType" value="ACTIVE_RESTAURANT" />
      <input type="hidden" name="establishmentType" value={payload.establishmentType} />
      <input type="hidden" name="assessmentPayload" value={JSON.stringify(payload)} />
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {tc("submitResultsHeading")}
      </p>
      <input
        suppressHydrationWarning
        name="businessName"
        required
        placeholder={tc("restaurantNamePlaceholder")}
        className="w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
      <input
        suppressHydrationWarning
        name="contactName"
        required
        placeholder={tc("yourNamePlaceholder")}
        className="w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          suppressHydrationWarning
          name="email"
          type="email"
          required
          placeholder={tc("emailPlaceholder")}
          className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <input
          suppressHydrationWarning
          name="phone"
          required
          placeholder={tc("phonePlaceholder")}
          className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <button
        suppressHydrationWarning
        disabled={pending}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        <Send className="h-3.5 w-3.5" />
        {tc("submitForReview")}
      </button>
    </form>
  );
}
