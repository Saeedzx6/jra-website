import { getTranslations, setRequestLocale } from "next-intl/server";
import { FileText, ClipboardCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getAllStandards } from "@/lib/classification";

// Cached and revalidated every 3600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 3600;

const TYPE_SLUGS: Record<string, string> = {
  RESTAURANT: "restaurant",
  FAST_FOOD: "fast-food",
  COFFEE_SHOP: "coffee-shop",
  BAR: "bar",
  DISCO: "disco",
  NIGHTCLUB: "nightclub",
  TOURIST_PARK: "tourist-park",
};

export default async function ClassificationHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tc = await getTranslations("classification");
  const tType = await getTranslations("classification.typeLabels");

  const standards = await getAllStandards();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        {t("classification")}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
        {tc("heroTitle")}
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">{tc("heroBody")}</p>

      {/* Step one is choosing what you are. The primary action used to link
          straight to /classification/restaurant, so a coffee shop owner landed
          on the restaurant standard — 222 points and five stars against the
          wrong criteria — and would have submitted it as a restaurant. The
          choice is now the page's first action rather than a library below the
          fold. */}
      <section aria-labelledby="choose-type" className="mt-10">
        <h2 id="choose-type" className="font-display text-xl font-semibold text-ink">
          {tc("chooseTypeHeading")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          {tc("chooseTypeBody")}
        </p>
        <p className="mt-2 text-sm text-ink-faint">{tc("noAccountNote")}</p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {standards.map((s) => {
            const scoreable = s.totalPossiblePoints > 0;
            const href = `/classification/${TYPE_SLUGS[s.establishmentType]}`;
            return (
              <li key={s.id}>
                {/* Scoreable standards are a single large target: the whole card
                    is the choice. The rest cannot be assessed yet, so they stay
                    inert with the PDF as the only action — a card that looks
                    clickable and is not would be worse. */}
                {scoreable ? (
                  <Link
                    href={href}
                    className="reveal motion-card group flex h-full flex-col rounded-2xl border border-rule bg-surface p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <h3 className="font-display text-base font-semibold text-ink transition-colors group-hover:text-accent">
                      {tType(s.establishmentType)}
                    </h3>
                    <p className="mt-1 text-sm text-ink-soft" dir="rtl">
                      {s.titleAr}
                    </p>
                    <p className="mt-2 text-xs font-medium text-olive-text">
                      {tc("pointsAcross", { points: s.totalPossiblePoints })}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                      <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {tc("startForType", { type: tType(s.establishmentType) })}
                    </span>
                  </Link>
                ) : (
                  <div className="reveal flex h-full flex-col rounded-2xl border border-dashed border-rule bg-surface p-5">
                    <h3 className="font-display text-base font-semibold text-ink-soft">
                      {tType(s.establishmentType)}
                    </h3>
                    <p className="mt-1 text-sm text-ink-faint" dir="rtl">
                      {s.titleAr}
                    </p>
                    <p className="mt-2 text-xs font-medium text-brass-text">
                      {tc("scoringComingSoon")}
                    </p>
                    {s.sourcePdfUrl ? (
                      <a
                        href={s.sourcePdfUrl}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {tc("downloadPdf")}
                      </a>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* The published documents stay reachable for anyone who wants to read
            the standard itself rather than score against it. */}
        <details className="reveal mt-8 rounded-2xl border border-rule bg-surface p-5">
          <summary className="cursor-pointer text-sm font-semibold text-ink">
            {tc("standardsLibrary")}
          </summary>
          <ul className="mt-4 space-y-2">
            {standards
              .filter((s) => s.sourcePdfUrl)
              .map((s) => (
                <li key={s.id}>
                  <a
                    href={s.sourcePdfUrl!}
                    className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {tType(s.establishmentType)}
                  </a>
                </li>
              ))}
          </ul>
        </details>
      </section>
    </div>
  );
}
