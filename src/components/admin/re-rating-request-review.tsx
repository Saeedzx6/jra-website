"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, X, RefreshCw } from "lucide-react";
import { declineReRating, openReRating } from "@/lib/actions/classification";

/**
 * The decision on a re-rating request.
 *
 * Opening one lets the establishment fill in a fresh checklist against its
 * current state; the grade it already holds stays in place until the new
 * assessment is reviewed. Refusing needs a reason for the same reason
 * refusing an assessment does — "no" on its own leaves nothing to act on.
 */
export function ReRatingRequestReview({
  sessionId,
  reason,
}: {
  sessionId: string;
  reason: string | null;
}) {
  const t = useTranslations("admin.assessments.reRating");
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"idle" | "decline">("idle");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-accent/40 bg-accent-soft/40 p-5">
      <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
        <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t("heading")}
      </h2>

      <p className="mt-2 text-sm text-ink-soft">
        {reason ? (
          <>
            <span className="font-medium text-ink">{t("reasonGiven")}</span> {reason}
          </>
        ) : (
          t("noReasonGiven")
        )}
      </p>

      {mode === "decline" ? (
        <div className="mt-4">
          <label htmlFor="decline-note" className="block text-sm font-medium text-ink-soft">
            {t("reasonLabel")}
          </label>
          <textarea
            id="decline-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            required
            className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {mode === "decline" ? (
          <>
            <button
              type="button"
              disabled={pending || !note.trim()}
              onClick={() =>
                start(async () => {
                  setError(null);
                  try {
                    await declineReRating(sessionId, note);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : t("failed"));
                  }
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-danger px-5 py-2.5 text-sm font-semibold text-danger-text disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("confirmDecline")}
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
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setError(null);
                  try {
                    await openReRating(sessionId);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : t("failed"));
                  }
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("open")}
            </button>
            <button
              type="button"
              onClick={() => setMode("decline")}
              className="inline-flex items-center gap-1.5 rounded-full border border-rule px-5 py-2.5 text-sm font-semibold text-ink-soft hover:border-danger hover:text-danger-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("decline")}
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
