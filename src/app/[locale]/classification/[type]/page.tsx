import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getStandardWithCriteria } from "@/lib/classification";
import { PublicClassificationChecklist } from "@/components/classification/public-checklist";

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

export default async function PublicAssessmentPage({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}) {
  const { locale, type } = await params;
  setRequestLocale(locale);
  const tc = await getTranslations("classification");
  const establishmentType = TYPE_MAP[type];
  if (!establishmentType) notFound();

  const standard = await getStandardWithCriteria(establishmentType);
  if (!standard || standard.sections.length === 0) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-xs font-eyebrow font-semibold text-accent">
        {tc("selfAssessmentKicker")}
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{standard.titleEn}</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">{tc("publicIntro")}</p>

      <div className="mt-8">
        <PublicClassificationChecklist
          establishmentType={establishmentType}
          sections={standard.sections}
          starBands={standard.starBands}
          totalPoints={standard.totalPossiblePoints}
        />
      </div>
    </div>
  );
}
