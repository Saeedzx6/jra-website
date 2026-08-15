import { getTranslations, setRequestLocale } from "next-intl/server";
import { Tag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";

// Cached and revalidated every 600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 600;

const CATEGORY_KEYS = [
  "RESTAURANT_FOR_SALE",
  "EQUIPMENT_SALE",
  "EQUIPMENT_RENT",
  "INVESTMENT_OPPORTUNITY",
] as const;

export default async function MarketplacePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const tm = await getTranslations("marketplace");
  const tCategory = await getTranslations("marketplace.categoryLabels");
  const { category } = await searchParams;

  const listings = await db.marketplaceListing.findMany({
    where: {
      status: "PUBLISHED",
      ...(category ? { category: category as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { images: { take: 1 } },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">{t("marketplace")}</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">{tm("description")}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/marketplace"
          className={`rounded-full px-3 py-1.5 text-sm ${!category ? "bg-accent text-white" : "border border-rule text-ink-soft"}`}
        >
          {tm("all")}
        </Link>
        {CATEGORY_KEYS.map((key) => (
          <Link
            key={key}
            href={`/marketplace?category=${key}`}
            className={`rounded-full px-3 py-1.5 text-sm ${category === key ? "bg-accent text-white" : "border border-rule text-ink-soft"}`}
          >
            {tCategory(key)}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <p className="mt-16 text-center text-ink-soft">{tCommon("noResults")}</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/marketplace/${l.id}`}
              className="motion-card block rounded-2xl border border-rule bg-surface p-5"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brass-soft px-2.5 py-0.5 text-xs font-medium text-brass-text">
                <Tag className="h-3 w-3" />
                {tCategory(l.category)}
              </span>
              <h3 className="mt-3 font-display text-base font-semibold text-ink">{l.title}</h3>
              {l.price ? (
                <p className="tabular mt-1 text-sm font-medium text-accent">
                  {l.price} {l.priceCurrency}
                </p>
              ) : (
                <p className="mt-1 text-sm text-ink-faint">{tm("priceOnRequest")}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-2xl border border-dashed border-rule bg-surface p-6 text-center">
        <p className="text-sm text-ink-soft">{tm("membersNote")}</p>
        <Link href="/portal/marketplace" className="mt-2 inline-block text-sm font-medium text-accent">
          {tm("goToPortal")} →
        </Link>
      </div>
    </div>
  );
}
