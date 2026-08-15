import { getTranslations } from "next-intl/server";

/**
 * Route-level loading state. A skeleton rather than a spinner: it reserves the
 * space the content will occupy, so arriving content doesn't shift the layout
 * (CLS), and it reads as "this is nearly here" rather than "this is stuck".
 *
 * Pure CSS pulse, so it inherits the global prefers-reduced-motion handling in
 * globals.css without needing its own opt-out.
 */
export default async function LocaleLoading() {
  const t = await getTranslations("errors");

  return (
    <div
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{t("loading")}</span>

      <div className="h-9 w-2/3 max-w-sm animate-pulse rounded-lg bg-surface-2" />
      <div className="mt-3 h-5 w-full max-w-xl animate-pulse rounded bg-surface-2" />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-rule bg-surface">
            <div className="aspect-[4/3] animate-pulse bg-surface-2" />
            <div className="space-y-3 p-5">
              <div className="h-5 w-3/4 animate-pulse rounded bg-surface-2" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
