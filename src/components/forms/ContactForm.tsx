"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { submitContactInquiry } from "@/lib/actions/contact";

type Errors = Partial<Record<"name" | "email" | "message", string>>;

/**
 * The designed validation behaviour is preserved exactly — validate on blur,
 * error beside the field, focus the first invalid field on a failed submit,
 * announce success without stealing focus. What changed is the ending: instead
 * of resolving locally, a valid submit now posts to submitContactInquiry,
 * which rate-limits, re-validates server-side and writes a ContactInquiry row
 * for the admin inbox.
 *
 * Client validation stays because it is the fast, accessible half; it is not
 * the security boundary. The server schema is.
 */
export function ContactForm() {
  const t = useTranslations("contact");
  const tCommon = useTranslations("newsletter");
  const id = useId();

  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
    setServerError(null);

    const firstKey = Object.keys(found)[0];
    if (firstKey) {
      event.currentTarget
        .querySelector<HTMLElement>(`[name="${firstKey}"]`)
        ?.focus();
      return;
    }

    const formData = new FormData();
    formData.set("name", values.name.trim());
    formData.set("email", values.email.trim());
    formData.set("message", values.message.trim());
    // The server schema requires a subject and this form has no subject field
    // — the design deliberately asks for three things, not four. A constant
    // keeps the contract satisfied without adding a field to the design; the
    // admin inbox groups these as general website enquiries.
    formData.set("subject", "Website enquiry");

    startTransition(async () => {
      const result = await submitContactInquiry({ ok: false }, formData);
      if (result.ok) {
        setSent(true);
        setValues({ name: "", email: "", message: "" });
      } else {
        setServerError(result.error === "rate_limited" ? t("rateLimited") : t("serverError"));
      }
    });
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

      <button
        type="submit"
        className="btn"
        style={{ justifySelf: "start" }}
        disabled={pending}
        aria-disabled={pending}
      >
        {pending ? t("sending") : t("send")}
      </button>

      {serverError && (
        <p className="field-error" role="alert">
          {serverError}
        </p>
      )}

      <p role="status" aria-live="polite">
        {sent ? t("sent") : ""}
      </p>
    </form>
  );
}
