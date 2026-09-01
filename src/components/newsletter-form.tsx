"use client";

import { useActionState, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";
import { NEWSLETTER_INTERESTS } from "@/lib/newsletter-interests";

/**
 * Validation and feedback behaviour, which is the part being designed:
 *  - validates on blur and on submit, never per keystroke
 *  - the error sits beside the field it belongs to and is linked by
 *    aria-describedby, not dumped in a summary at the top
 *  - the success message is announced via a live region without stealing focus
 */
export function NewsletterForm() {
  const t = useTranslations("newsletterForm");
  const id = useId();

  const [state, formAction, pending] = useActionState(subscribeToNewsletter, {
    ok: false,
  });
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function validate(value: string): string | null {
    if (!value.trim()) return t("required");
    // Deliberately permissive: the only reliable proof an address works is
    // sending to it, so this rejects only shapes that cannot be addresses.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return t("invalidEmail");
    return null;
  }

  if (state.ok) {
    return (
      <p className="flow-row" role="status" aria-live="polite">
        <Check className="h-5 w-5" aria-hidden="true" />
        <span>{t("subscribed")}</span>
      </p>
    );
  }

  return (
    <form action={formAction} noValidate>
      <div className="field">
        <label htmlFor={`${id}-email`}>{t("email")}</label>
        <input
          suppressHydrationWarning
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(validate(event.target.value));
          }}
          onBlur={() => setError(validate(email))}
          placeholder={t("emailPlaceholder")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          required
        />
        {error && (
          <p className="field-error" id={`${id}-error`} role="alert">
            {error}
          </p>
        )}
      </div>

      <fieldset
        style={{ border: 0, padding: 0, margin: "1.25rem 0 0" }}
      >
        <legend className="eyebrow" style={{ color: "var(--ink-soft)", marginBlockEnd: "0.5rem" }}>
          {t("interests")}
        </legend>

        <div className="checks">
          {NEWSLETTER_INTERESTS.map((interest) => (
            <label key={interest}>
              <input type="checkbox" name="interests" value={interest} />
              {t(`interest_${interest}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        suppressHydrationWarning
        type="submit"
        className="btn"
        disabled={pending}
        style={{ marginBlockStart: "1.25rem" }}
      >
        {t("subscribe")}
      </button>

      {state.error && (
        <p className="field-error" role="alert" style={{ marginBlockStart: "0.75rem" }}>
          {t(state.error === "rate_limited" ? "rateLimited" : "invalidEmail")}
        </p>
      )}
    </form>
  );
}
