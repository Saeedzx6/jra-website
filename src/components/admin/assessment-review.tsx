"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, X, Star, AlertCircle } from "lucide-react";
import { approveAssessment, rejectAssessment } from "@/lib/actions/classification";

/**
 * The decision step on a submitted assessment.
 *
 * Approving awards the star grade to the listing — the point at which a
 * self-assessment stops being a private calculation and becomes JRA's
 * published rating. That is worth an explicit confirmation rather than a
 * single click, so the primary button arms and the confirm states what will
 * happen.
 */
export function AssessmentReview({
  sessionId,
  stars,
  decided,
  reviewNote,
}: {
  sessionId: string;
  stars: number | null;
  decided: "APPROVED" | "REJECTED" | null;
  reviewNote: string | null;
}) {
  const t = useTranslations("admin.assessments.review");
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"idle" | "confirmApprove" | "reject">("idle");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (decided) {
    const approved = decided === "APPROVED";
    return (
      <div
        className={`rounded-2xl border p-5 ${
          approved ? "border-success/40 bg-success-soft" : "border-rule bg-surface-2"
        }`}
      >
        <p
          className={`flex items-center gap-2 text-sm font-semibold ${
            approved ? "text-success-text" : "text-ink-soft"
          }`}
        >
          {approved ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
          {approved ? t("approvedWith", { stars: stars ?? 0 }) : t("rejected")}
        </p>
        {reviewNote ? <p className="mt-2 text-sm text-ink-soft">{reviewNote}</p> : null}
      </div>
    );
  }

  const canAward = stars != null && stars > 0;

  return (
    <div className="rounded-2xl border border-rule bg-surface p-5">
      <h2 className="font-display text-base font-semibold text-ink">{t("heading")}</h2>

      {canAward ? (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
          {t("willAward")}
          <span className="inline-flex items-center gap-0.5 text-brass-text">
            {Array.from({ length: stars }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-brass" aria-hidden="true" />
            ))}
          </span>
        </p>
      ) : (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-warning-text">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t("noGrade")}
        </p>
      )}

      {mode === "reject" ? (
        <div className="mt-4">
          <label htmlFor="reject-note" className="block text-sm font-medium text-ink-soft">
            {t("reasonLabel")}
          </label>
          <textarea
            id="reject-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            required
            className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <p className="mt-1 text-xs text-ink-faint">{t("reasonHint")}</p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {mode === "confirmApprove" ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setError(null);
                  try {
                    await approveAssessment(sessionId);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : t("failed"));
                  }
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-success px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("confirmAward", { stars: stars ?? 0 })}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="text-sm font-medium text-ink-soft hover:text-ink"
            >
              {t("cancel")}
            </button>
          </>
        ) : mode === "reject" ? (
          <>
            <button
              type="button"
              disabled={pending || !note.trim()}
              onClick={() =>
                start(async () => {
                  setError(null);
                  try {
                    await rejectAssessment(sessionId, note);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : t("failed"));
                  }
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-danger px-5 py-2.5 text-sm font-semibold text-danger-text disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("confirmReject")}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="text-sm font-medium text-ink-soft hover:text-ink"
            >
              {t("cancel")}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={!canAward}
              onClick={() => setMode("confirmApprove")}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("approve")}
            </button>
            <button
              type="button"
              onClick={() => setMode("reject")}
              className="inline-flex items-center gap-1.5 rounded-full border border-rule px-5 py-2.5 text-sm font-semibold text-ink-soft hover:border-danger hover:text-danger-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("reject")}
            </button>
          </>
        )}

        <span role="status" aria-live="polite" className="text-sm">
          {error ? <span className="text-danger-text">{error}</span> : null}
        </span>
      </div>
    </div>
  );
}
