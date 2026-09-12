"use client";

import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Paperclip, AlertCircle, Loader2 } from "lucide-react";
import { submitMembershipApplication } from "@/lib/actions/membership";
import { UPLOAD_MAX_BYTES } from "@/lib/prepare-image";

export function MembershipForm({
  governorates = [],
}: {
  governorates?: { id: string; nameEn: string; nameAr: string | null }[];
} = {}) {
  const tf = useTranslations("membershipForm");
  const [state, formAction, pending] = useActionState(submitMembershipApplication, {
    ok: false,
  });
  const [type, setType] = useState<"ACTIVE_RESTAURANT" | "ASSOCIATE_SUPPLIER">(
    "ACTIVE_RESTAURANT"
  );
  const [fileError, setFileError] = useState<string | null>(null);

  // "Apply as a supplier" on the directory links here with ?apply=supplier, so
  // arriving from that button lands on the right half of the form rather than
  // asking the reader to find and flip the toggle themselves.
  const params = useSearchParams();
  useEffect(() => {
    if (params.get("apply") === "supplier") setType("ASSOCIATE_SUPPLIER");
  }, [params]);

  /**
   * Documents here are PDFs and scans, which cannot be downscaled the way a
   * photo can, and the whole submission travels as one server-action body.
   * Checking the total up front turns a platform 413 — which reaches the
   * reader as a blank failure — into a sentence telling them what to do.
   */
  function checkTotalSize(form: HTMLFormElement) {
    const input = form.elements.namedItem("documents");
    if (!(input instanceof HTMLInputElement) || !input.files) return true;
    let total = 0;
    for (const f of Array.from(input.files)) total += f.size;
    if (total > UPLOAD_MAX_BYTES) {
      setFileError(tf("filesTooLarge", { mb: (total / (1024 * 1024)).toFixed(1) }));
      return false;
    }
    setFileError(null);
    return true;
  }

  if (state.ok) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-success-soft p-4 text-success-text">
        <Check className="h-5 w-5" />
        <span>{tf("received")}</span>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!checkTotalSize(e.currentTarget)) e.preventDefault();
      }}
      className="space-y-5"
    >
      <div className="grid grid-cols-2 gap-2 rounded-full border border-rule bg-surface p-1">
        {(
          [
            ["ACTIVE_RESTAURANT", tf("restaurantVenue")],
            ["ASSOCIATE_SUPPLIER", tf("supplier")],
          ] as const
        ).map(([value, label]) => (
          <button suppressHydrationWarning
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              type === value ? "bg-accent text-white" : "text-ink-soft hover:bg-surface-2"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <input suppressHydrationWarning type="hidden" name="applicantType" value={type} />

      <div className="grid gap-4 sm:grid-cols-2">
        <input suppressHydrationWarning
          name="businessName"
          required
          placeholder={type === "ACTIVE_RESTAURANT" ? tf("restaurantNamePlaceholder") : tf("companyNamePlaceholder")}
          className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <input suppressHydrationWarning
          name="contactName"
          required
          placeholder={tf("contactPersonPlaceholder")}
          className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <input suppressHydrationWarning
          name="email"
          type="email"
          required
          placeholder={tf("emailPlaceholder")}
          className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <input suppressHydrationWarning
          name="phone"
          required
          placeholder={tf("phonePlaceholder")}
          className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      {type === "ACTIVE_RESTAURANT" && (
        <input suppressHydrationWarning
          name="classificationClaim"
          placeholder={tf("classificationClaimPlaceholder")}
          className="w-full rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      )}

      {type === "ASSOCIATE_SUPPLIER" && (
        <div className="space-y-4 rounded-2xl border border-rule bg-surface-2 p-5">
          <p className="text-sm font-medium text-ink">{tf("supplierSectionTitle")}</p>
          <textarea suppressHydrationWarning
            name="productsSupplied"
            required
            rows={3}
            placeholder={tf("productsSuppliedPlaceholder")}
            className="w-full rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input suppressHydrationWarning
              name="registrationNumber"
              placeholder={tf("registrationNumberPlaceholder")}
              className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
            <input suppressHydrationWarning
              name="yearsTrading"
              placeholder={tf("yearsTradingPlaceholder")}
              className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
            <input suppressHydrationWarning
              name="website"
              type="url"
              dir="ltr"
              placeholder={tf("websitePlaceholder")}
              className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
            {governorates.length > 0 ? (
              <select suppressHydrationWarning
                name="governorateId"
                defaultValue=""
                className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
              >
                <option value="">{tf("governoratePlaceholder")}</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nameEn}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>
      )}

      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink-soft">
          <Paperclip className="h-4 w-4" />
          {tf("supportingDocuments")} <span className="text-ink-faint">{tf("optional")}</span>
        </span>
        <input
          suppressHydrationWarning
          type="file"
          name="documents"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
          className="w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-accent-strong"
        />
        <span className="mt-1 block text-xs text-ink-faint">{tf("documentsHint")}</span>
      </label>

      {fileError || state.error ? (
        <p
          aria-live="polite"
          className="flex items-start gap-1.5 rounded-xl bg-danger-soft p-3 text-sm text-danger-text"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {fileError ?? tf(`error_${state.error}`)}
        </p>
      ) : null}

      <button suppressHydrationWarning
        type="submit"
        disabled={pending}
        className="pill-press w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto"
      >
        {pending ? <Loader2 className="me-1.5 inline h-3.5 w-3.5 animate-spin align-[-2px]" aria-hidden="true" /> : null}
        {tf("submitApplication")}
      </button>
    </form>
  );
}
