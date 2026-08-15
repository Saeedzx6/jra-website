"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

/**
 * Error boundary for the locale segment. Must be a client component — Next
 * requires it, since `reset` re-runs the failed render on the client.
 *
 * When an error tracker is wired up (Phase 0), report from the effect below:
 * this is the one place every unhandled render error in the public site passes
 * through, so it is where the report belongs.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    // Keep the digest in the browser console so a report from a user ("I saw an
    // error") can be matched to the server log entry for the same render.
    console.error("Unhandled render error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brass-soft">
        <AlertTriangle className="h-6 w-6 text-brass-text" aria-hidden="true" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">{t("errorTitle")}</h1>
      <p className="mt-3 leading-relaxed text-ink-soft">{t("errorBody")}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t("errorRetry")}
        </button>
        <a
          href="/"
          className="inline-flex items-center rounded-full border border-rule px-6 py-3 text-sm font-semibold text-ink-soft transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t("errorHome")}
        </a>
      </div>

      {error.digest ? (
        <p className="tabular mt-6 text-xs text-ink-faint" dir="ltr">
          {error.digest}
        </p>
      ) : null}
    </div>
  );
}
