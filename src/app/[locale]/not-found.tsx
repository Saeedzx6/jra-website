"use client";

import { useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * 404 inside the locale segment, so it inherits the header, footer and
 * direction from the locale layout. Before this existed, a bad URL fell through
 * to Next's built-in page: unbranded, English-only, and RTL-unaware.
 */
export default function LocaleNotFound() {
  const t = useTranslations("errors");

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
        <SearchX className="h-6 w-6 text-accent" aria-hidden="true" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">
        {t("notFoundTitle")}
      </h1>
      <p className="mt-3 leading-relaxed text-ink-soft">{t("notFoundBody")}</p>
      <Link
        href="/restaurants"
        className="mt-8 inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {t("notFoundCta")}
      </Link>
    </div>
  );
}
