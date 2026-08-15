import type { Metadata } from "next";
import { routing, type AppLocale } from "@/i18n/routing";

/**
 * Absolute origin for canonical URLs, hreflang alternates, OG images and the
 * sitemap. Metadata needs absolute URLs — a relative canonical is ignored by
 * crawlers — so this has to resolve at build time as well as at request time.
 *
 * Set NEXT_PUBLIC_SITE_URL in production. The Vercel fallback covers preview
 * deploys, where the origin is not known until the build runs.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/+$/, "");

/** Joins a locale-less path onto the origin, e.g. ("en", "/restaurants") → https://…/en/restaurants */
export function localeUrl(locale: string, path = "/"): string {
  const clean = path === "/" ? "" : `/${path.replace(/^\/+/, "").replace(/\/+$/, "")}`;
  return `${SITE_URL}/${locale}${clean}`;
}

/**
 * Canonical + hreflang for a page that exists in every locale.
 *
 * `x-default` points at English: it is the fallback crawlers use when the
 * visitor's language matches neither, and the default locale in routing.ts.
 */
export function alternatesFor(locale: string, path = "/"): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = localeUrl(l, path);
  languages["x-default"] = localeUrl(routing.defaultLocale, path);

  return { canonical: localeUrl(locale, path), languages };
}

const OG_LOCALE: Record<AppLocale, string> = { en: "en_US", ar: "ar_JO" };

type BuildMetadataArgs = {
  locale: string;
  /** Locale-less path, e.g. "/restaurants/zorba". */
  path: string;
  title: string;
  description?: string;
  /** Absolute image URL. Falls back to the site-wide OG image. */
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: Date | null;
  /** Set for pages that should stay out of the index (search results, auth). */
  noIndex?: boolean;
};

/**
 * Single builder for every page's metadata, so canonical/hreflang/OG never
 * drift apart across routes. Pages call this from `generateMetadata`.
 */
export function buildMetadata({
  locale,
  path,
  title,
  description,
  image,
  type = "website",
  publishedTime,
  noIndex = false,
}: BuildMetadataArgs): Metadata {
  const url = localeUrl(locale, path);
  const ogImage = image ?? `${SITE_URL}/brand/og-default.png`;
  const isKnownLocale = (routing.locales as readonly string[]).includes(locale);

  return {
    title,
    description,
    alternates: alternatesFor(locale, path),
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      url,
      siteName: "Jordan Restaurant Association",
      locale: isKnownLocale ? OG_LOCALE[locale as AppLocale] : OG_LOCALE.en,
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime: publishedTime.toISOString() } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

/**
 * Trims HTML down to a plain-text meta description. Descriptions are truncated
 * by search engines around 155-160 characters, so there is no value in longer.
 */
export function toDescription(html: string | null | undefined, max = 155): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return undefined;
  if (text.length <= max) return text;
  // Cut on a word boundary so the description doesn't end mid-word.
  return `${text.slice(0, text.lastIndexOf(" ", max - 1)).trimEnd()}…`;
}
