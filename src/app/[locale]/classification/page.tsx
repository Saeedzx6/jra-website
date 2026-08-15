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

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/classification/restaurant"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          <ClipboardCheck className="h-4 w-4" />
          {tc("startCta")}
        </Link>
      </div>
      <p className="mt-3 text-sm text-ink-faint">{tc("noAccountNote")}</p>

      <h2 className="mt-14 font-display text-xl font-semibold text-ink">{tc("standardsLibrary")}</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {standards.map((s) => (
          <div key={s.id} className="rounded-2xl border border-rule bg-surface p-5">
            <h3 className="font-display text-base font-semibold text-ink">
              {tType(s.establishmentType)}
            </h3>
            <p className="mt-1 text-sm text-ink-soft" dir="rtl">
              {s.titleAr}
            </p>
            {s.totalPossiblePoints > 0 ? (
              <p className="mt-2 text-xs font-medium text-olive-text">
                {tc("pointsAcross", { points: s.totalPossiblePoints })}
              </p>
            ) : (
              <p className="mt-2 text-xs font-medium text-brass-text">{tc("scoringComingSoon")}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {s.totalPossiblePoints > 0 ? (
                <Link
                  href={`/classification/${TYPE_SLUGS[s.establishmentType]}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  {tc("takeAssessment")}
                </Link>
              ) : null}
              {s.sourcePdfUrl ? (
                <a
                  href={s.sourcePdfUrl}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft"
                >
                  <FileText className="h-4 w-4" />
                  {tc("downloadPdf")}
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
