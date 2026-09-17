"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, Check, X, Loader2 } from "lucide-react";
import { openReRating, declineReRating } from "@/lib/actions/classification";
import { cx, ui } from "@/lib/ui";

export type ReRatingRequest = {
  id: string;
  restaurantName: string;
  reason: string | null;
  requestedAt: string | null;
  cycle: number;
};

/**
 * The requests an establishment has made to be rated again.
 *
 * `requestReRating` has been wired to a button in the member portal since the
 * portal was built, and `openReRating`/`declineReRating` have existed to answer
 * it -- but nothing ever listed the requests, so an owner who asked saw
 * "awaiting opening" and JRA never saw that they had asked. This is the
 * missing half.
 *
 * Refusing needs a reason for the same reason refusing an assessment does: an
 * establishment told only "no" has nothing to act on. Refusal sets the session
 * to REJECTED, which `nextAction` treats as a dead end they may restart from,
 * so a refused request is not a lock-out.
 */
export function ReRatingQueue({ requests }: { requests: ReRatingRequest[] }) {
  const t = useTranslations("admin.assessments.reRating");

  if (requests.length === 0) {
    return (
      <div className={cx(ui.panel, "mt-4 text-sm text-ink-soft")}>{t("none")}</div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {requests.map((r) => (
        <Row key={r.id} request={r} />
      ))}
    </div>
  );
}

function Row({ request }: { request: ReRatingRequest }) {
  const t = useTranslations("admin.assessments.reRating");
  const [mode, setMode] = useState<"idle" | "decline">("idle");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  /** Both decisions fail the same way, so they report the same way. */
  const run = (fn: () => Promise<void>) =>
    start(async () => {
      setError(null);
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : t("failed"));
      }
    });

  return (
    <div className={ui.panel}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{request.restaurantName}</p>
          <p className="mt-0.5 text-xs text-ink-faint">
            {t("cycleLabel", { cycle: request.cycle })}
            {request.requestedAt
              ? ` · ${new Date(request.requestedAt).toLocaleDateString()}`
              : ""}
          </p>
        </div>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin text-ink-faint" aria-hidden="true" />
        ) : null}
      </div>

      {/* The reason is what the decision is actually made on. */}
      <div className="mt-3 rounded-xl border border-rule bg-paper p-3">
        <p className="ui-caps text-xs font-semibold text-ink-faint">{t("reasonGiven")}</p>
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
          {request.reason?.trim() || t("noReasonGiven")}
        </p>
      </div>

      {mode === "decline" ? (
        <div className="mt-3">
          <label className={ui.fieldLabel} htmlFor={`note-${request.id}`}>
            {t("declineReasonLabel")}
          </label>
          <textarea
            id={`note-${request.id}`}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={cx("w-full", ui.field)}
          />
          <p className="mt-1 text-xs text-ink-faint">{t("declineReasonHint")}</p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {mode === "decline" ? (
          <>
            <button
              type="button"
              disabled={pending || !note.trim()}
              onClick={() => run(() => declineReRating(request.id, note))}
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
              onClick={() => run(() => openReRating(request.id))}
              className="inline-flex items-center gap-1.5 rounded-full bg-success px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("open")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setMode("decline")}
              className="inline-flex items-center gap-1.5 rounded-full border border-rule px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-danger hover:text-danger-text disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("decline")}
            </button>
          </>
        )}
      </div>

      {error ? <p className="mt-3 text-sm text-danger-text">{error}</p> : null}
    </div>
  );
}
