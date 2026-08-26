"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, Send } from "lucide-react";
import { requestReRating } from "@/lib/actions/classification";

/**
 * Asks JRA to open a fresh rating cycle.
 *
 * The reason is required rather than decorative: it is what the reviewer reads
 * when deciding whether to open the cycle, and "we renovated the kitchen" and
 * "we disagree with the grade" deserve different answers.
 */
export function ReRatingRequestForm({ restaurantId }: { restaurantId: string }) {
  const tc = useTranslations("classification");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (sent) {
    return <p className="mt-3 text-sm text-olive-text">{tc("reRatingRequested")}</p>;
  }

  if (!open) {
    return (
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-rule px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent"
      >
        <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
        {tc("requestReRating")}
      </button>
    );
  }

  return (
    <div className="mt-3">
      <label htmlFor={`reason-${restaurantId}`} className="block text-sm font-medium text-ink-soft">
        {tc("reRatingReason")}
      </label>
      <textarea
        id={`reason-${restaurantId}`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          suppressHydrationWarning
          type="button"
          disabled={pending || !reason.trim()}
          onClick={() =>
            start(async () => {
              setError(null);
              try {
                await requestReRating(restaurantId, reason);
                setSent(true);
              } catch (e) {
                setError(e instanceof Error ? e.message : tc("reRatingFailed"));
              }
            })
          }
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
          {tc("sendRequest")}
        </button>
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm font-medium text-ink-soft hover:text-ink"
        >
          {tc("cancel")}
        </button>
        <span role="status" aria-live="polite" className="text-sm">
          {error ? <span className="text-danger-text">{error}</span> : null}
        </span>
      </div>
    </div>
  );
}
