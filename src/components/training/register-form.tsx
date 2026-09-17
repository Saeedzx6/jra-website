"use client";
import { cx, ui } from "@/lib/ui";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { registerForSession } from "@/lib/actions/training";

export function CourseRegisterForm({ sessionId }: { sessionId: string }) {
  const tt = useTranslations("training");
  const action = registerForSession.bind(null, sessionId);
  const [state, formAction, pending] = useActionState(action, { ok: false });

  if (state.ok) {
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-olive-text">
        <Check className="h-4 w-4" /> {tt("registered")}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-3 flex flex-wrap gap-2">
      <input name="fullName" required placeholder={tt("fullNamePlaceholder")} className={cx("flex-1 min-w-[140px]", ui.fieldCompact)} />
      <input name="email" type="email" required placeholder={tt("emailPlaceholder")} className={cx("flex-1 min-w-[140px]", ui.fieldCompact)} />
      <input name="phone" placeholder={tt("phonePlaceholder")} className={cx("w-32", ui.fieldCompact)} />
      <button disabled={pending} className="pill-press rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? <Loader2 className="me-1.5 inline h-3.5 w-3.5 animate-spin align-[-2px]" aria-hidden="true" /> : null}
        {tt("register")}
      </button>
    </form>
  );
}
