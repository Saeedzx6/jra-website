import { db } from "@/lib/db";
import type { RestaurantCardData } from "@/components/restaurant-card";

function toCardData(r: {
  slug: string;
  name: string;
  nameAr: string | null;
  shortDescription: string | null;
  images: { url: string; isPrimary: boolean }[];
  governorate: { nameEn: string; nameAr: string | null } | null;
  cuisines: { cuisine: { nameEn: string; nameAr: string | null } }[];
  classificationLevel: { stars: number } | null;
}): RestaurantCardData {
  const primary = r.images.find((i) => i.isPrimary) ?? r.images[0];
  return {
    slug: r.slug,
    name: r.name,
    nameAr: r.nameAr,
    shortDescription: r.shortDescription,
    imageUrl: primary?.url ?? null,
    governorateName: r.governorate?.nameEn ?? null,
    cuisineName: r.cuisines[0]?.cuisine.nameEn ?? null,
    stars: r.classificationLevel?.stars ?? null,
  };
}

const cardInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  governorate: true,
  cuisines: { include: { cuisine: true }, take: 1 },
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
