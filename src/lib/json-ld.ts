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

/**
 * Site-wide identity. Rendered once, in the locale layout.
 *
 * Typed as both Organization and LocalBusiness: JRA is a trade association,
 * but it is also a place people visit at a street address in Jabal Amman, and
 * the LocalBusiness type is what puts an address, phone and map pin into a
 * knowledge panel. The address, phone and email match the footer and the
 * contact page exactly — a mismatch between structured data and the visible
 * page is treated as a quality signal against the site.
 */
export function organizationLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": `${SITE_URL}/#organization`,
    name: "Jordan Restaurant Association",
    alternateName: "نقابة أصحاب المطاعم الأردنية",
    url: localeUrl(locale, "/"),
    logo: `${SITE_URL}/brand/jra-logo.png`,
    image: `${SITE_URL}/brand/og-default.png`,
    foundingDate: "2002",
    telephone: "+962-6-462-1558",
    email: "info@jra.jo",
    sameAs: ["https://www.facebook.com/JoRestaurants"],
    address: {
      "@type": "PostalAddress",
      addressCountry: "JO",
      addressLocality: "Amman",
      streetAddress:
        locale === "ar"
          ? "جبل عمان، الدوار الثاني، شارع سلمان المادبي، عمارة رقم 12"
          : "Jabal Amman, 2nd Circle, Salman Al-Madabi St, Building 12",
    },
    // No `geo` and no `openingHours`: JRA has not supplied coordinates or
    // office hours, and inventing either would be worse than omitting them.
  };
}

/**
 * The site itself, with the directory search wired up as a SearchAction.
 *
 * This is what makes a sitelinks search box possible in Google results — a
 * visitor searching for JRA gets a search field that queries the directory
 * directly. It only works because /restaurants already accepts `?q=`.
 */
export function webSiteLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: localeUrl(locale, "/"),
    name: "Jordan Restaurant Association",
    inLanguage: locale === "ar" ? "ar-JO" : "en-JO",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${localeUrl(locale, "/restaurants")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
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
