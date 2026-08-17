"use client";

import { useActionState, useId } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { loginAction } from "@/lib/actions/auth";

/**
 * Member sign-in.
 *
 * This replaces the front-end prototype, which rendered a disabled button and
 * a notice saying no authentication sat behind it. It now posts to
 * loginAction, which runs the real credential check and redirects to /admin or
 * /portal depending on role — so the notice is gone, because it would now be
 * false.
 *
 * The visual language is unchanged: .field, .btn and the Direction B tokens.
 */
export function LoginForm() {
  const t = useTranslations("login");
  const id = useId();

  const [state, formAction, pending] = useActionState(loginAction, { ok: false });

  return (
    <form
      action={formAction}
      style={{
        maxInlineSize: "26rem",
        display: "grid",
        gap: "1.25rem",
        padding: "2rem",
        background: "var(--surface)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Announced rather than only shown: a sighted user sees the message
          appear, a screen-reader user is told. */}
      {state.error && (
        <p
          role="alert"
          style={{
            padding: "0.85rem 1rem",
            borderRadius: "var(--r-md)",
            borderInlineStart: "4px solid var(--color-danger)",
            background: "var(--color-danger-soft)",
            fontSize: "0.875rem",
            color: "var(--color-danger-text)",
          }}
        >
          {state.error === "rate_limited" ? t("rateLimited") : t("incorrectCredentials")}
        </p>
      )}

      <div className="field">
        <label htmlFor={`${id}-email`}>{t("email")}</label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          required
        />
      </div>

      <div className="field">
        <label htmlFor={`${id}-password`}>{t("password")}</label>
        <input
          id={`${id}-password`}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <button type="submit" className="btn" disabled={pending} aria-disabled={pending}>
        {pending ? t("signingIn") : t("logIn")}
      </button>

      <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)" }}>
        {t("memberAccountsNote")}
      </p>

      <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)" }}>
        {t("noAccount")}{" "}
        <Link href="/membership" style={{ color: "var(--accent)", fontWeight: 700 }}>
          {t("join")}
        </Link>
      </p>
    </form>
  );
}
