"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { registerForSession } from "@/lib/actions/training";

export function CourseRegisterForm({ sessionId }: { sessionId: string }) {
  const tt = useTranslations("training");
  const action = registerForSession.bind(null, sessionId);
  const [state, formAction, pending] = useActionState(action, { ok: false });

  if (state.ok) {
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-success-text">
        <Check className="h-4 w-4" /> {tt("registered")}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-3 flex flex-wrap gap-2">
      <input suppressHydrationWarning name="fullName" required placeholder={tt("fullNamePlaceholder")} className="flex-1 min-w-[140px] rounded-lg border border-rule bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none" />
      <input suppressHydrationWarning name="email" type="email" required placeholder={tt("emailPlaceholder")} className="flex-1 min-w-[140px] rounded-lg border border-rule bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none" />
      <input suppressHydrationWarning name="phone" placeholder={tt("phonePlaceholder")} className="w-32 rounded-lg border border-rule bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none" />
      <button suppressHydrationWarning disabled={pending} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {tt("register")}
      </button>
    </form>
  );
}
