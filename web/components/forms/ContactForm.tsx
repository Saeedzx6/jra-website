"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

type Errors = Partial<Record<"name" | "email" | "message", string>>;

/**
 * No backend: submission resolves locally. The validation behaviour is the
 * designed part — validate on blur, error beside the field, focus the first
 * invalid field on a failed submit, announce success without stealing focus.
 */
export function ContactForm() {
  const t = useTranslations("contact");
  const tCommon = useTranslations("newsletter");
  const id = useId();

  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  function validate(next = values): Errors {
    const found: Errors = {};
    if (!next.name.trim()) found.name = tCommon("required");
    if (!next.email.trim()) found.email = tCommon("required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email.trim()))
      found.email = tCommon("invalidEmail");
    if (next.message.trim().length < 10) found.message = t("messageTooShort");
    return found;
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate();
    setErrors(found);

    const firstKey = Object.keys(found)[0];
    if (firstKey) {
      event.currentTarget
        .querySelector<HTMLElement>(`[name="${firstKey}"]`)
        ?.focus();
      return;
    }
    setSent(true);
  }

  const field = (key: keyof typeof values) => ({
    name: key,
    value: values[key],
    "aria-invalid": errors[key] ? (true as const) : undefined,
    "aria-describedby": errors[key] ? `${id}-${key}-error` : undefined,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const next = { ...values, [key]: event.target.value };
      setValues(next);
      if (errors[key]) setErrors(validate(next));
    },
    onBlur: () => setErrors((current) => ({ ...current, ...validate() })),
  });

  return (
    <form onSubmit={onSubmit} noValidate style={{ display: "grid", gap: "1.25rem" }}>
      <div className="field">
        <label htmlFor={`${id}-name`}>{t("name")}</label>
        <input id={`${id}-name`} type="text" autoComplete="name" {...field("name")} />
        {errors.name && (
          <p className="field-error" id={`${id}-name-error`} role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={`${id}-email`}>{t("email")}</label>
        <input
          id={`${id}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          {...field("email")}
        />
        {errors.email && (
          <p className="field-error" id={`${id}-email-error`} role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={`${id}-message`}>{t("message")}</label>
        <textarea id={`${id}-message`} rows={6} {...field("message")} />
        {errors.message && (
          <p className="field-error" id={`${id}-message-error`} role="alert">
            {errors.message}
          </p>
        )}
      </div>

      <button type="submit" className="btn" style={{ justifySelf: "start" }}>
        {t("send")}
      </button>

      <p role="status" aria-live="polite">
        {sent ? t("sent") : ""}
      </p>
    </form>
  );
}
