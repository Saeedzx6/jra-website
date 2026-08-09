/**
 * Seeds the Restaurant Directory from the legacy nopCommerce export
 * (resutaurants.xlsx, Product sheet) — the 701 rows whose Categories field
 * contains "Restaurants" (as opposed to the 54 supplier rows, which are
 * deliberately NOT migrated — see plan §4 Step 4). See plan §4 Step 2.
 */
import sanitizeHtml from "sanitize-html";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { guessGovernorateSlug, legacyPath, makeUniqueSlugger, splitSemicolonList, slugify } from "./util";

type ProductRow = {
  ProductType: string;
  Name: string;
  ShortDescription: string | null;
  FullDescription: string | null;
  Published: boolean;
  Categories: string | null;
  Manufacturers: string | null;
  ProductTags: string | null;
};

function sanitize(html: string | null): string | null {
  if (!html) return null;
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "b", "i", "ul", "ol", "li", "span", "a", "h3", "h4"],
    allowedAttributes: { a: ["href"] },
  });
}

async function main() {
  const wb = XLSX.readFile(legacyPath("resutaurants.xlsx"));
  const rows = XLSX.utils.sheet_to_json<ProductRow>(wb.Sheets["Product"]!);
  const restaurantRows = rows.filter((r) => r.Categories?.includes("Restaurant"));

  console.log(`Found ${restaurantRows.length} restaurant rows (of ${rows.length} total products).`);

  const nextSlug = makeUniqueSlugger();
  const cuisines = await db.cuisine.findMany();
  const cuisineBySlug = new Map(cuisines.map((c) => [c.slug, c]));
  const tags = await db.amenityTag.findMany();
  const tagBySlug = new Map(tags.map((t) => [t.slug, t]));
  const governorates = await db.governorate.findMany();
  const govBySlug = new Map(governorates.map((g) => [g.slug, g]));

  let created = 0;
  let published = 0;
  let drafted = 0;
  let govMatched = 0;

  for (let i = 0; i < restaurantRows.length; i++) {
    const row = restaurantRows[i]!;
    if (!row.Name) continue;

    const slug = nextSlug(row.Name);
    const status = row.Published ? "PUBLISHED" : "DRAFT";
    if (status === "PUBLISHED") published++;
    else drafted++;

    const govText = `${row.ShortDescription ?? ""} ${row.FullDescription ?? ""}`;
    const govSlug = guessGovernorateSlug(govText);
    if (govSlug) govMatched++;
    const governorate = govSlug ? govBySlug.get(govSlug) : undefined;

    const restaurant = await db.restaurant.upsert({
      where: { slug },
      update: {
        name: row.Name,
        shortDescription: row.ShortDescription ?? null,
        fullDescriptionHtml: sanitize(row.FullDescription),
        addressText: row.ShortDescription ?? null,
        governorateId: governorate?.id,
        status,
        source: "LEGACY_IMPORT",
        legacyProductId: i,
      },
      create: {
        slug,
        name: row.Name,
        shortDescription: row.ShortDescription ?? null,
        fullDescriptionHtml: sanitize(row.FullDescription),
        addressText: row.ShortDescription ?? null,
        governorateId: governorate?.id,
        status,
        source: "LEGACY_IMPORT",
        legacyProductId: i,
      },
    });

    // Cuisines (Manufacturers field, semicolon-delimited)
    const cuisineNames = splitSemicolonList(row.Manufacturers);
    for (const name of cuisineNames) {
      const cuisine = cuisineBySlug.get(slugify(name));
      if (!cuisine) continue;
      await db.restaurantCuisine.upsert({
        where: { restaurantId_cuisineId: { restaurantId: restaurant.id, cuisineId: cuisine.id } },
        update: {},
        create: { restaurantId: restaurant.id, cuisineId: cuisine.id },
      });
    }

    // Amenity tags (ProductTags field, semicolon-delimited)
    const tagNames = splitSemicolonList(row.ProductTags);
    for (const name of tagNames) {
      const tag = tagBySlug.get(slugify(name));
      if (!tag) continue;
      await db.restaurantAmenityTag.upsert({
        where: {
          restaurantId_amenityTagId: { restaurantId: restaurant.id, amenityTagId: tag.id },
        },
        update: {},
        create: { restaurantId: restaurant.id, amenityTagId: tag.id },
      });
    }

    created++;
    if (created % 100 === 0) console.log(`  ...${created} processed`);
  }

  console.log(`✓ restaurants: ${created} (published=${published}, draft=${drafted})`);
  console.log(`  governorate matched: ${govMatched}/${created}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
