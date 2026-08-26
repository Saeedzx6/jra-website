import { db } from "@/lib/db";
import type { RestaurantCardData } from "@/components/restaurant-card";

function toCardData(r: {
  slug: string;
  name: string;
  nameAr: string | null;
  shortDescription: string | null;
  phone?: string | null;
  openingHoursText?: string | null;
  images: { url: string; isPrimary: boolean }[];
  governorate: { nameEn: string; nameAr: string | null } | null;
  cuisines: { cuisine: { nameEn: string; nameAr: string | null } }[];
  amenityTags?: { amenityTag: { nameEn: string; nameAr: string | null } }[];
  classificationLevel: { stars: number } | null;
}): RestaurantCardData {
  const primary = r.images.find((i) => i.isPrimary) ?? r.images[0];
  return {
    slug: r.slug,
    name: r.name,
    nameAr: r.nameAr,
    shortDescription: r.shortDescription,
    imageUrl: primary?.url ?? null,
    // Both languages travel to the card, which picks by locale. Resolving to
    // English here meant every card on the Arabic site showed an English
    // governorate and cuisine under an Arabic restaurant name.
    governorateName: r.governorate?.nameEn ?? null,
    governorateNameAr: r.governorate?.nameAr ?? null,
    cuisineName: r.cuisines[0]?.cuisine.nameEn ?? null,
    cuisineNameAr: r.cuisines[0]?.cuisine.nameAr ?? null,
    // Both languages again, for the same reason as the governorate above.
    tags: (r.amenityTags ?? []).map((t) => ({
      en: t.amenityTag.nameEn,
      ar: t.amenityTag.nameAr,
    })),
    stars: r.classificationLevel?.stars ?? null,
    hasPhone: Boolean(r.phone),
    hasHours: Boolean(r.openingHoursText),
  };
}

const cardInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  governorate: true,
  cuisines: { include: { cuisine: true }, take: 1 },
  // Three is what the card shows; fetching more would be paid for and thrown
  // away on every row of every directory page.
  amenityTags: { include: { amenityTag: true }, take: 3 },
  classificationLevel: true,
};

export async function getFeaturedRestaurants(limit = 6) {
  const rows = await db.restaurant.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sustainabilityScore: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: cardInclude,
  });
  return rows.map(toCardData);
}

export type RestaurantFilters = {
  q?: string;
  governorate?: string;
  cuisine?: string;
  /** Amenity tag slug — the home page console's "Feature" field. */
  feature?: string;
  stars?: number;
  page?: number;
};

const PAGE_SIZE = 12;

export async function searchRestaurants(filters: RestaurantFilters) {
  const where = {
    status: "PUBLISHED" as const,
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" as const } },
            { nameAr: { contains: filters.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(filters.governorate ? { governorate: { slug: filters.governorate } } : {}),
    ...(filters.cuisine ? { cuisines: { some: { cuisine: { slug: filters.cuisine } } } } : {}),
    ...(filters.feature
      ? { amenityTags: { some: { amenityTag: { slug: filters.feature } } } }
      : {}),
    ...(filters.stars ? { classificationLevel: { stars: filters.stars } } : {}),
  };

  const page = filters.page && filters.page > 0 ? filters.page : 1;

  const [rows, total] = await Promise.all([
    db.restaurant.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: cardInclude,
    }),
    db.restaurant.count({ where }),
  ]);

  return {
    items: rows.map(toCardData),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getRestaurantBySlug(slug: string) {
  return db.restaurant.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      governorate: true,
      area: true,
      classificationLevel: true,
      cuisines: { include: { cuisine: true } },
      amenityTags: { include: { amenityTag: true } },
    },
  });
}

export async function getDirectoryFacets() {
  const [governorates, cuisines] = await Promise.all([
    db.governorate.findMany({ orderBy: { nameEn: "asc" } }),
    db.cuisine.findMany({ orderBy: { nameEn: "asc" } }),
  ]);
  return { governorates, cuisines };
}
