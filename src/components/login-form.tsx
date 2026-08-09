"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction } from "@/lib/actions/auth";

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
        <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-ink-soft">
          {tl("email")}
        </label>
        <input suppressHydrationWarning
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-ink-soft">
          {tl("password")}
        </label>
        <input suppressHydrationWarning
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <button suppressHydrationWarning
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {tl("logIn")}
      </button>
      <p className="text-center text-xs text-ink-faint">{tl("memberAccountsNote")}</p>
    </form>
  );
}
