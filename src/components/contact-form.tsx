"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { submitContactInquiry } from "@/lib/actions/contact";

export function ContactForm() {
  const t = useTranslations("common");
  const tf = useTranslations("contactForm");
  const [state, formAction, pending] = useActionState(submitContactInquiry, { ok: false });

  if (state.ok) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-olive-soft p-4 text-olive-text">
        <Check className="h-5 w-5" />
        <span>{tf("thanks")}</span>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input suppressHydrationWarning
          name="name"
          required
          placeholder={tf("fullNamePlaceholder")}
          className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <input suppressHydrationWarning
          name="email"
          type="email"
          required
          placeholder={tf("emailPlaceholder")}
          className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <input suppressHydrationWarning
        name="phone"
        placeholder={tf("phoneOptionalPlaceholder")}
        className="w-full rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
      />
      <input suppressHydrationWarning
        name="subject"
        required
        placeholder={tf("subjectPlaceholder")}
        className="w-full rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
      />
      <textarea suppressHydrationWarning
        name="message"
        required
        rows={5}
        placeholder={tf("messagePlaceholder")}
        className="w-full rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
      />
      <button suppressHydrationWarning
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {t("submit")}
      </button>
    </form>
  );
}
