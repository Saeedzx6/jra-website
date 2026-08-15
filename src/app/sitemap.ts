import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { routing } from "@/i18n/routing";
import { localeUrl } from "@/lib/seo";

/**
 * Sitemap covering both locales.
 *
 * Every entry carries `alternates.languages` so crawlers understand that the
 * English and Arabic URLs are the same page rather than duplicate content —
 * without that pairing, a bilingual site competes with itself in search.
 *
 * Revalidated hourly rather than built once: restaurants and news are edited
 * from the admin back-office continuously, and a sitemap frozen at deploy time
 * would never list anything published afterwards.
 */
export const revalidate = 3600;

/** Public routes that exist under every locale and are not database-driven. */
const STATIC_PATHS = [
  "/",
  "/about",
  "/restaurants",
  "/suppliers",
  "/classification",
  "/membership",
  "/legal",
  "/news",
  "/magazine",
  "/training",
  "/sustainability",
  "/knowledge",
  "/projects",
  "/opportunities",
  "/marketplace",
  "/jobs",
  "/contact",
  "/newsletter",
] as const;

/** Roughly how often each area actually changes, for crawl budgeting. */
const CHANGE_FREQUENCY: Record<string, MetadataRoute.Sitemap[number]["changeFrequency"]> = {
  "/": "daily",
  "/news": "daily",
  "/restaurants": "weekly",
  "/marketplace": "weekly",
  "/training": "weekly",
};

function entry(
  path: string,
  lastModified?: Date,
  priority = 0.5
): MetadataRoute.Sitemap[number][] {
  return routing.locales.map((locale) => ({
    url: localeUrl(locale, path),
    lastModified,
    changeFrequency: CHANGE_FREQUENCY[path] ?? "monthly",
    priority,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, localeUrl(l, path)])
      ),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [restaurants, news, legal, magazine, resources, courses] = await Promise.all([
    db.restaurant.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    db.newsArticle.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, publishedAt: true },
    }),
    db.legalDocument.findMany({ select: { slug: true } }),
    db.magazineArticle.findMany({ select: { slug: true } }),
    db.resource.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, type: true },
    }),
    db.course.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    }),
  ]);

  return [
    // Homepage carries the highest priority; the directory is the primary
    // entry point for search traffic, so it sits just below.
    ...entry("/", undefined, 1.0),
    ...STATIC_PATHS.filter((p) => p !== "/").flatMap((p) =>
      entry(p, undefined, p === "/restaurants" ? 0.9 : 0.6)
    ),

    // The 701 restaurant pages are the site's real SEO surface.
    ...restaurants.flatMap((r) => entry(`/restaurants/${r.slug}`, r.updatedAt, 0.8)),
    ...news.flatMap((n) => entry(`/news/${n.slug}`, n.publishedAt ?? undefined, 0.7)),
    ...legal.flatMap((l) => entry(`/legal/${l.slug}`, undefined, 0.6)),
    ...magazine.flatMap((m) => entry(`/magazine/${m.slug}`, undefined, 0.5)),
    ...courses.flatMap((c) => entry(`/training/${c.slug}`, undefined, 0.5)),
    ...resources.flatMap((r) => entry(`/knowledge/${r.slug}`, undefined, 0.5)),
  ];
}
