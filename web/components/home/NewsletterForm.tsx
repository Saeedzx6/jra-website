"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { newsletterInterests, pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

/**
 * There is no backend, so submission resolves locally. The validation and
 * feedback behaviour is real, because that is the part being designed:
 *  - validates on blur/submit, never per keystroke
 *  - the error sits beside the field it belongs to and is linked by
 *    aria-describedby, not dumped in a summary at the top
 *  - focus moves to the invalid field on a failed submit
 *  - the success message is announced via a live region without stealing focus
 */
export function NewsletterForm() {
  const t = useTranslations("newsletter");
  const locale = useLocale() as Locale;
  const id = useId();

  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function validate(value: string): string | null {
    if (!value.trim()) return t("required");
    // Deliberately permissive: the only reliable proof an address works is
    // sending to it, so this rejects shapes that cannot be addresses at all.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return t("invalidEmail");
    return null;
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validate(email);
    setError(problem);

    if (problem) {
      event.currentTarget
        .querySelector<HTMLInputElement>(`#${CSS.escape(`${id}-email`)}`)
        ?.focus();
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor={`${id}-email`}>{t("email")}</label>
        <input
          id={`${id}-email`}
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

      <fieldset style={{ border: 0, padding: 0, margin: "1.25rem 0 0" }}>
        <legend
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "var(--label-tracking)",
            textTransform: "var(--eyebrow-transform)" as never,
            color: "var(--ink-soft)",
            marginBlockEnd: "0.5rem",
          }}
        >
          {t("interests")}
        </legend>

        <div className="checks">
          {newsletterInterests.map((interest) => {
            const value = interest.en;
            return (
              <label key={value}>
                <input
                  type="checkbox"
                  checked={interests.includes(value)}
                  onChange={(event) =>
                    setInterests((current) =>
                      event.target.checked
                        ? [...current, value]
                        : current.filter((i) => i !== value),
                    )
                  }
                />
                {pick(interest, locale)}
              </label>
            );
          })}
        </div>
      </fieldset>

      <button type="submit" className="btn" style={{ marginBlockStart: "1.25rem" }}>
        {t("subscribe")}
      </button>

      {/* polite + non-focus-stealing, per WCAG status message guidance */}
      <p role="status" aria-live="polite" style={{ marginBlockStart: "0.75rem" }}>
        {done ? t("success") : ""}
      </p>
    </form>
  );
}
