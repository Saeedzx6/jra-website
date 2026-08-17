/**
 * Generates the public directory snapshot that the front end filters in the
 * browser: src/data/{restaurants,suppliers,vocab}.json.
 *
 * WHY A SNAPSHOT AND NOT A QUERY
 * ------------------------------
 * The directory UI filters the whole dataset client-side — typing in the search
 * console re-filters instantly with no round trip, and the governorate/cuisine/
 * feature chips are pure client state. That interaction is the design. Moving
 * it to server-driven searchParams would put a request between every keystroke
 * and change the product, so the data is bundled instead.
 *
 * These files were originally produced by web/scripts/extract-data.py from the
 * nopCommerce xlsx export. The database is now the source of truth, so they are
 * produced from Prisma instead — the SHAPE is unchanged, which is what lets
 * lib/directory.ts and every component that reads it stay untouched.
 *
 * Consequence worth knowing: edits made in the admin panel do not reach the
 * public directory until this runs again. It is wired into `npm run build`;
 * run `npm run data:directory` by hand after editing listings in dev.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db";

const OUT_DIR = path.join(process.cwd(), "src", "data");

/** How many amenity tags become filter chips. The source export exposed 20; the
 *  database carries 207, nearly all of them long-tail one-offs. Taking the 20
 *  most-used reproduces the original chip row rather than a 207-item wall. */
const FEATURE_LIMIT = 20;

/** Blurb length used by the original extract, truncated on a word boundary. */
const BLURB_CHARS = 200;

/**
 * The home rail is a curated order, not a query — it was hand-picked in
 * vocab.featured and is preserved verbatim. Slugs that no longer resolve are
 * dropped rather than substituted, so the rail never silently changes.
 */
const FEATURED_SLUGS = [
  "reem-al-bawadi",
  "fakhreldin",
  "zaatar-w-zeit",
  "shams-el-balad",
  "romero-restaurant",
  "peking",
  "vintage-restaurant",
  "abu-jbara",
  "arabica-jordan",
  "al-mankal",
  "ararat-restaurant",
  "fame-restaurant",
];

/**
 * The blurb comes from the FULL description, never the short one.
 *
 * The legacy import writes the spreadsheet's ShortDescription into BOTH
 * `shortDescription` and `addressText` — in that export the "short
 * description" column is the street address, not prose. Reading it here
 * produced cards whose body copy was their own address repeated.
 */
function toBlurb(html: string | null): string {
  const source = stripHtml(html ?? "");
  if (source.length <= BLURB_CHARS) return source;
  const cut = source.slice(0, BLURB_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
}

/** The export delimits address parts with pipes; the original extract rendered
 *  them as a comma-separated line. */
function toAddress(value: string | null): string {
  return (value ?? "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The original shape carries three flat image slots: logo (Picture1), image
 * (Picture2) and image2 (Picture3). Primary first, then sortOrder — so the
 * card hero is the image an editor marked primary.
 */
function imageSlots(images: { url: string; isPrimary: boolean; sortOrder: number }[]) {
  const ordered = [...images].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder,
  );
  return {
    logo: ordered[0]?.url ?? "",
    image: ordered[1]?.url ?? "",
    image2: ordered[2]?.url ?? "",
  };
}

/** Sorted, de-duplicated, blanks removed. */
function uniqueSorted(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v && v.trim())))].sort((a, b) =>
    a.localeCompare(b),
  );
}

async function main() {
  const [restaurantRows, supplierRows] = await Promise.all([
    db.restaurant.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { name: "asc" },
      include: {
        governorate: true,
        images: { select: { url: true, isPrimary: true, sortOrder: true } },
        cuisines: { include: { cuisine: true } },
        amenityTags: { include: { amenityTag: true } },
      },
    }),
    db.supplier.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { name: "asc" },
      include: {
        governorate: true,
        images: { select: { url: true, isPrimary: true, sortOrder: true } },
        categories: { include: { category: true } },
      },
    }),
  ]);

  // Count tag usage first so the chip row can be capped to the most common.
  const tagUsage = new Map<string, number>();
  for (const r of restaurantRows) {
    for (const t of r.amenityTags) {
      const name = t.amenityTag.nameEn;
      tagUsage.set(name, (tagUsage.get(name) ?? 0) + 1);
    }
  }
  const features = [...tagUsage.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, FEATURE_LIMIT)
    .map(([name]) => name)
    .sort((a, b) => a.localeCompare(b));

  const restaurants = restaurantRows.map((r) => ({
    slug: r.slug,
    name: r.name,
    address: toAddress(r.addressText),
    // The original "city" column is the governorate — vocab.cities and the
    // city filter are both governorate-level, so this stays governorate.
    city: r.governorate?.nameEn ?? "",
    tags: r.amenityTags.map((t) => t.amenityTag.nameEn),
    blurb: toBlurb(r.fullDescriptionHtml),
    ...imageSlots(r.images),
    cuisine: r.cuisines[0]?.cuisine.nameEn ?? "",
  }));

  const suppliers = supplierRows.map((s) => ({
    slug: s.slug,
    name: s.name,
    address: toAddress(s.addressText),
    city: s.governorate?.nameEn ?? "",
    tags: [] as string[],
    blurb: toBlurb(s.fullDescriptionHtml),
    ...imageSlots(s.images),
    trade: s.categories[0]?.category.nameEn ?? "",
  }));

  const cuisines = uniqueSorted(restaurants.map((r) => r.cuisine));
  const trades = uniqueSorted(suppliers.map((s) => s.trade));
  const cities = uniqueSorted([
    ...restaurants.map((r) => r.city),
    ...suppliers.map((s) => s.city),
  ]);

  const bySlug = new Set(restaurants.map((r) => r.slug));
  const featured = FEATURED_SLUGS.filter((slug) => bySlug.has(slug));

  const vocab = {
    cuisines,
    trades,
    cities,
    features,
    featured,
    totals: {
      restaurants: restaurants.length,
      suppliers: suppliers.length,
      cuisines: cuisines.length,
      trades: trades.length,
      governorates: cities.length,
      features: features.length,
    },
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, "restaurants.json"), JSON.stringify(restaurants), "utf8");
  writeFileSync(path.join(OUT_DIR, "suppliers.json"), JSON.stringify(suppliers), "utf8");
  writeFileSync(path.join(OUT_DIR, "vocab.json"), JSON.stringify(vocab, null, 2), "utf8");

  console.log(`✓ restaurants: ${restaurants.length}`);
  console.log(`✓ suppliers:   ${suppliers.length}`);
  console.log(`✓ cuisines=${cuisines.length} trades=${trades.length} governorates=${cities.length} features=${features.length}`);
  if (featured.length !== FEATURED_SLUGS.length) {
    const missing = FEATURED_SLUGS.filter((s) => !bySlug.has(s));
    console.warn(`! featured rail: ${featured.length}/${FEATURED_SLUGS.length} resolved — missing: ${missing.join(", ")}`);
  } else {
    console.log(`✓ featured rail: ${featured.length}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
