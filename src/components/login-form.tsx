"use client";

import { Loader2 } from "lucide-react";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction } from "@/lib/actions/auth";
import { cx, ui } from "@/lib/ui";

export function LoginForm() {
  const tl = useTranslations("login");
  const [state, formAction, pending] = useActionState(loginAction, { ok: false });

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <div className="rounded-lg bg-accent-soft px-4 py-2.5 text-sm text-accent-strong">
          {tl("incorrectCredentials")}
        </div>
      ) : null}
      <div>
        <label htmlFor="login-email" className={ui.fieldLabel}>
          {tl("email")}
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={cx("w-full", ui.fieldOnPaper)}
        />
      </div>
      <div>
        <label htmlFor="login-password" className={ui.fieldLabel}>
          {tl("password")}
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={cx("w-full", ui.fieldOnPaper)}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="pill-press w-full rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? <Loader2 className="me-1.5 inline h-3.5 w-3.5 animate-spin align-[-2px]" aria-hidden="true" /> : null}
        {tl("logIn")}
      </button>
      <p className="text-center text-xs text-ink-faint">{tl("memberAccountsNote")}</p>
    </form>
  );
}
