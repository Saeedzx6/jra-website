import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

/**
 * The vocabulary behind the home page search console.
 *
 * In the design-system implementation this came from a static JSON file
 * generated at build time from the nopCommerce exports. Here it comes from the
 * database, so the console's options are whatever is actually in the directory
 * rather than whatever was in the last export.
 *
 * Labels are localised at query time; slugs are what the /restaurants route
 * filters on, so the two are carried separately.
 */
export type VocabTerm = { slug: string; label: string };

export type Suggestion = {
  label: string;
  kind: "restaurant" | "cuisine" | "governorate";
  /** Slug of the target, or of the filter to apply. */
  slug: string;
};

export type DirectoryVocab = {
  cuisines: VocabTerm[];
  governorates: VocabTerm[];
  features: VocabTerm[];
  suggestions: Suggestion[];
  totals: {
    restaurants: number;
    cuisines: number;
    governorates: number;
    features: number;
  };
};

const label = (locale: string, en: string, ar: string | null) =>
  locale === "ar" && ar ? ar : en;

/**
 * Only tags that are actually attached to a published restaurant are offered.
 * A filter that can only ever return nothing is worse than no filter — the
 * seed carries 207 amenity tags and a good many are unused.
 */
async function build(locale: string): Promise<DirectoryVocab> {
  const [cuisines, governorates, features, restaurants, restaurantCount] =
    await Promise.all([
      db.cuisine.findMany({
        where: { restaurants: { some: { restaurant: { status: "PUBLISHED" } } } },
        select: { slug: true, nameEn: true, nameAr: true },
        orderBy: { nameEn: "asc" },
      }),
      db.governorate.findMany({
        where: { restaurants: { some: { status: "PUBLISHED" } } },
        select: { slug: true, nameEn: true, nameAr: true },
        orderBy: { nameEn: "asc" },
      }),
      db.amenityTag.findMany({
        where: { restaurants: { some: { restaurant: { status: "PUBLISHED" } } } },
        select: { slug: true, nameEn: true, nameAr: true },
        orderBy: { nameEn: "asc" },
      }),
      db.restaurant.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, name: true, nameAr: true },
        orderBy: { name: "asc" },
      }),
      db.restaurant.count({ where: { status: "PUBLISHED" } }),
    ]);

  const term = (t: { slug: string; nameEn: string; nameAr: string | null }) => ({
    slug: t.slug,
    label: label(locale, t.nameEn, t.nameAr),
  });

  return {
    cuisines: cuisines.map(term),
    governorates: governorates.map(term),
    features: features.map(term),
    suggestions: [
      ...restaurants.map((r) => ({
        label: label(locale, r.name, r.nameAr),
        kind: "restaurant" as const,
        slug: r.slug,
      })),
      ...cuisines.map((c) => ({
        label: label(locale, c.nameEn, c.nameAr),
        kind: "cuisine" as const,
        slug: c.slug,
      })),
      ...governorates.map((g) => ({
        label: label(locale, g.nameEn, g.nameAr),
        kind: "governorate" as const,
        slug: g.slug,
      })),
    ],
    totals: {
      restaurants: restaurantCount,
      cuisines: cuisines.length,
      governorates: governorates.length,
      features: features.length,
    },
  };
}

export const getDirectoryVocab = (locale: string) =>
  unstable_cache(() => build(locale), ["directory-vocab", locale], {
    revalidate: 3600,
    tags: ["restaurants"],
  })();
