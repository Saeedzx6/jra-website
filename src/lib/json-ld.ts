import { SITE_URL, localeUrl } from "@/lib/seo";
import type { PriceTier } from "@prisma/client";

/**
 * Structured data builders. These drive Google's rich results — the star
 * rating, address and cuisine that appear under a directory listing in search.
 * For a culinary directory this is the highest-value markup on the site.
 *
 * Emit with:
 *   <script type="application/ld+json"
 *           dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
 */

/**
 * Serialises for embedding in a <script> tag. `<` is escaped because a `</script>`
 * sequence inside a string value would otherwise close the tag early — the
 * standard XSS vector for inline JSON.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** schema.org priceRange uses $-notation; map our tiers onto it. */
const PRICE_RANGE: Record<PriceTier, string | undefined> = {
  UNKNOWN: undefined,
  BUDGET: "$",
  MODERATE: "$$",
  UPSCALE: "$$$",
  FINE_DINING: "$$$$",
};

type RestaurantLdInput = {
  slug: string;
  name: string;
  nameAr: string | null;
  shortDescription: string | null;
  addressText: string | null;
  phone: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  priceTier: PriceTier;
  openingHoursText: string | null;
  images: { url: string }[];
  governorate: { nameEn: string } | null;
  cuisines: { cuisine: { nameEn: string } }[];
  classificationLevel: { stars: number } | null;
};

export function restaurantLd(r: RestaurantLdInput, locale: string) {
  const description = r.shortDescription ?? undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": localeUrl(locale, `/restaurants/${r.slug}`),
    name: r.name,
    ...(r.nameAr ? { alternateName: r.nameAr } : {}),
    ...(description ? { description } : {}),
    url: localeUrl(locale, `/restaurants/${r.slug}`),
    ...(r.images.length > 0 ? { image: r.images.map((i) => i.url) } : {}),
    ...(r.phone ? { telephone: r.phone } : {}),
    ...(r.website ? { sameAs: [r.website] } : {}),
    ...(r.cuisines.length > 0
      ? { servesCuisine: r.cuisines.map((c) => c.cuisine.nameEn) }
      : {}),
    ...(PRICE_RANGE[r.priceTier] ? { priceRange: PRICE_RANGE[r.priceTier] } : {}),
    ...(r.openingHoursText ? { openingHours: r.openingHoursText } : {}),
    address: {
      "@type": "PostalAddress",
      addressCountry: "JO",
      ...(r.governorate ? { addressRegion: r.governorate.nameEn } : {}),
      ...(r.addressText ? { streetAddress: r.addressText } : {}),
    },
    // Coordinates are null across the directory today (they are never seeded).
    // Emitting a geo block with nulls is worse than omitting it, so this stays
    // conditional and will start populating itself after the geocoding backfill.
    ...(r.latitude != null && r.longitude != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: r.latitude,
            longitude: r.longitude,
          },
        }
      : {}),
    // The star grade is JRA's own classification, not a crowd rating, so it is
    // a Rating from the association rather than an aggregateRating from users.
    ...(r.classificationLevel
      ? {
          starRating: {
            "@type": "Rating",
            ratingValue: r.classificationLevel.stars,
            bestRating: 5,
            worstRating: 1,
            author: { "@type": "Organization", name: "Jordan Restaurant Association" },
          },
        }
      : {}),
  };
}

type ArticleLdInput = {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  authorName?: string | null;
};

export function newsArticleLd(a: ArticleLdInput, locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: a.title,
    ...(a.excerpt ? { description: a.excerpt } : {}),
    url: localeUrl(locale, `/news/${a.slug}`),
    mainEntityOfPage: localeUrl(locale, `/news/${a.slug}`),
    ...(a.coverImageUrl ? { image: [a.coverImageUrl] } : {}),
    ...(a.publishedAt ? { datePublished: a.publishedAt.toISOString() } : {}),
    author: { "@type": "Organization", name: a.authorName ?? "Jordan Restaurant Association" },
    publisher: {
      "@type": "Organization",
      name: "Jordan Restaurant Association",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/jra-logo.png` },
    },
  };
}

/** Site-wide identity. Rendered once, in the locale layout. */
export function organizationLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Jordan Restaurant Association",
    alternateName: "نقابة أصحاب المطاعم الأردنية",
    url: localeUrl(locale, "/"),
    logo: `${SITE_URL}/brand/jra-logo.png`,
    foundingDate: "2002",
    address: { "@type": "PostalAddress", addressCountry: "JO", addressLocality: "Amman" },
  };
}

/** Breadcrumbs give search results the "Home › Restaurants › Name" trail. */
export function breadcrumbLd(
  locale: string,
  trail: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: localeUrl(locale, item.path),
    })),
  };
}
