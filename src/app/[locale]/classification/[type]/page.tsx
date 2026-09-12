import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getStandardWithCriteria } from "@/lib/classification";
import { PublicClassificationChecklist } from "@/components/classification/public-checklist";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";

// Cached and revalidated every 3600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 3600;

const VALID_TYPES = [
  "restaurant",
  "fast-food",
  "coffee-shop",
  "bar",
  "disco",
  "nightclub",
  "tourist-park",
] as const;

const TYPE_MAP: Record<string, string> = {
  restaurant: "RESTAURANT",
  "fast-food": "FAST_FOOD",
  "coffee-shop": "COFFEE_SHOP",
  bar: "BAR",
  disco: "DISCO",
  nightclub: "NIGHTCLUB",
  "tourist-park": "TOURIST_PARK",
};

export function generateStaticParams() {
  return VALID_TYPES.map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}): Promise<Metadata> {
  const { locale, type } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const establishmentType = TYPE_MAP[type];

  // An unknown type 404s in the page body; the metadata still has to resolve,
  // and it must not invite indexing of a URL that will not render.
  if (!establishmentType) {
    return buildMetadata({
      locale,
      path: `/classification/${type}`,
      title: t("classificationTitle"),
      description: t("classificationDescription"),
      noIndex: true,
    });
  }

  // `getStandardWithCriteria` is React-cached, so this shares the page's query.
  const standard = await getStandardWithCriteria(establishmentType);
  const title =
    standard && locale === "ar" && standard.titleAr ? standard.titleAr : standard?.titleEn;

  return buildMetadata({
    locale,
    path: `/classification/${type}`,
    title: title ?? t("classificationTitle"),
    description: t("classificationDescription"),
    noIndex: !standard,
  });
}

export default async function PublicAssessmentPage({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}) {
  const { locale, type } = await params;
  setRequestLocale(locale);
  const tc = await getTranslations("classification");
  const tn = await getTranslations("nav");
  const establishmentType = TYPE_MAP[type];
  if (!establishmentType) notFound();

  const standard = await getStandardWithCriteria(establishmentType);
  if (!standard || standard.sections.length === 0) notFound();

  const standardTitle = locale === "ar" && standard.titleAr ? standard.titleAr : standard.titleEn;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        locale={locale}
        trail={[
          { name: tn("home"), path: "/" },
          { name: tn("classification"), path: "/classification" },
          { name: standardTitle, path: `/classification/${type}` },
        ]}
      />
      <p className="text-xs font-eyebrow font-semibold text-accent">
        {tc("selfAssessmentKicker")}
      </p>
      <h1 className="mt-1 font-display font-semibold text-5xl text-ink">{standardTitle}</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">{tc("publicIntro")}</p>

      <div className="mt-8">
        <PublicClassificationChecklist
          establishmentType={establishmentType}
          sections={standard.sections}
          starBands={standard.starBands}
          totalPoints={standard.totalPossiblePoints}
          gradingMode={standard.gradingMode}
        />
      </div>
    </div>
  );
}
