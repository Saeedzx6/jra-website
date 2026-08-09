"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";

export function NewsletterForm() {
  const t = useTranslations("home");
  const tf = useTranslations("newsletterForm");
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, { ok: false });

  if (state.ok) {
    return (
      <div className="mt-6 flex items-center justify-center gap-2 text-olive-soft">
        <Check className="h-5 w-5" />
        <span>{tf("subscribed")}</span>
      </div>
    );
  }

  return (
    <form action={formAction} className="mx-auto mt-6 flex max-w-md gap-2">
      <input suppressHydrationWarning
        type="email"
        name="email"
        required
        placeholder={t("newsletterPlaceholder")}
        className="w-full rounded-full border border-paper/25 bg-paper/10 px-4 py-2.5 text-sm text-paper placeholder:text-paper/50 focus:border-brass focus:outline-none"
      />
      <button suppressHydrationWarning
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-full bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {t("newsletterCta")}
      </button>
    </form>
  );
}
