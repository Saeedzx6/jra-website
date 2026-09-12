"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { FileText, ClipboardCheck } from "lucide-react";
import { approveMembershipApplication, rejectMembershipApplication } from "@/lib/actions/admin";

type AssessmentSummary = {
  establishmentType?: string;
  score?: number;
  totalPoints?: number;
  stars?: number;
  sections?: { name: string; score: number; max: number }[];
};

type SupplierDetails = {
  productsSupplied?: string;
  registrationNumber?: string;
  website?: string;
  yearsTrading?: string;
};

type Documents = {
  files?: string[];
  assessment?: AssessmentSummary;
  supplier?: SupplierDetails;
} | null;

export function MembershipApplicationRow({
  id,
  businessName,
  contactName,
  email,
  applicantType,
  documents,
}: {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  applicantType: string;
  documents?: Documents;
}) {
  const tm = useTranslations("admin.membership");
  const ta = useTranslations("admin.common");
  const tp = useTranslations("portal");
  const tCommon = useTranslations("common");
  const [pending, startTransition] = useTransition();
  const [credentials, setCredentials] = useState<{ email: string; tempPassword: string } | null>(
    null
  );
  const [rejected, setRejected] = useState(false);

  if (credentials) {
    return (
      <div className="rounded-2xl border border-olive bg-olive-soft p-5 text-olive-text">
        <p className="font-medium">{tm("approvedAccountCreated", { name: businessName })}</p>
        <p className="mt-1 text-sm">
          {tm("loginLabel")} <strong>{credentials.email}</strong> · {tm("tempPasswordLabel")}{" "}
          <strong>{credentials.tempPassword}</strong>
        </p>
        <p className="mt-1 text-xs opacity-80">{tm("shareSecurely")}</p>
      </div>
    );
  }

  if (rejected) {
    return (
      <div className="rounded-2xl border border-rule bg-surface-2 p-5 text-ink-faint">
        {tm("rejectedFor", { name: businessName })}
      </div>
    );
  }

  const files = documents?.files ?? [];
  const assessment = documents?.assessment;
  const supplier = documents?.supplier;

  return (
    <div className="rounded-2xl border border-rule bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-medium text-ink">{businessName}</p>
          <p className="text-sm text-ink-soft">
            {contactName} · {email}
          </p>
          <span className="mt-1 inline-block rounded-full bg-brass-soft px-2 py-0.5 text-xs font-medium text-brass-text">
            {applicantType === "ACTIVE_RESTAURANT" ? tp("restaurant") : tp("supplier")}
          </span>
        </div>
        <div className="flex shrink-0 gap-2">
          <button suppressHydrationWarning
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await approveMembershipApplication(id);
                setCredentials(res);
              })
            }
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {ta("approve")}
          </button>
          <button suppressHydrationWarning
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await rejectMembershipApplication(id);
                setRejected(true);
              })
            }
            className="rounded-full border border-rule px-4 py-1.5 text-xs font-semibold text-ink-soft disabled:opacity-60"
          >
            {ta("reject")}
          </button>
        </div>
      </div>

      {/* What an associate supplier answered. Without this the review screen
          showed a company name and an email and nothing about the business
          being assessed. */}
      {supplier ? (
        <div className="mt-3 rounded-xl border border-rule bg-surface-2 p-4">
          <p className="ui-caps font-semibold text-ink-faint">{tm("supplierDetails")}</p>
          {supplier.productsSupplied ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {supplier.productsSupplied}
            </p>
          ) : null}
          <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
            {[
              [tm("registrationNumber"), supplier.registrationNumber],
              [tm("yearsTrading"), supplier.yearsTrading],
              [tm("website"), supplier.website],
            ]
              .filter(([, v]) => Boolean(v))
              .map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <dt className="text-ink-faint">{label}</dt>
                  <dd className="min-w-0 break-words text-ink-soft" dir="ltr">
                    {value}
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      ) : null}

      {assessment ? (
        <div className="mt-4 rounded-xl bg-surface-2 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            <ClipboardCheck className="h-3.5 w-3.5" />
            {tm("selfAssessmentAttached")}
          </p>
          <p className="mt-1 text-sm text-ink">
            {tm("pointsSummary", {
              score: assessment.score !== undefined ? Math.round(assessment.score) : "—",
              total: assessment.totalPoints ?? "—",
            })}
            {assessment.stars
              ? tm("projectsToStars", {
                  stars: assessment.stars,
                  starWord: assessment.stars === 1 ? tCommon("star") : tCommon("stars"),
                })
              : ""}
          </p>
          {assessment.sections && assessment.sections.length > 0 ? (
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-soft sm:grid-cols-3">
              {assessment.sections.map((s) => (
                <div key={s.name} className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="tabular">
                    {Math.round(s.score)}/{s.max}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {files.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {tm("attachedDocuments")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {files.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 text-xs text-ink-soft hover:border-accent hover:text-accent"
              >
                <FileText className="h-3.5 w-3.5" />
                {url.split("/").pop()}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
