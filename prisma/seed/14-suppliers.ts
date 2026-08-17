/**
 * Seeds the Supplier Directory from the legacy nopCommerce export
 * (resutaurants.xlsx, Product sheet) — the rows whose Categories field does
 * NOT contain "Restaurant". These are the ~54 supplier rows that
 * 02-restaurants.ts deliberately skips.
 *
 * WHY THIS EXISTS
 * ---------------
 * The blueprint (§ "Suppliers half-built", item 14) records the supplier table
 * as shipping empty, with the full B2B module — verified profiles, RFQ
 * routing, group buying — scheduled for Phase 3 / M6. Nothing here pre-empts
 * that: it only populates the directory records the public supplier pages
 * render. When M6 lands it extends these rows rather than replacing them.
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

/**
 * On supplier rows the Categories cell is a semicolon-delimited list of leaf
 * category names with no breadcrumb — "Equipment;", "Dairy Products;". (The
 * restaurant rows are the ones that carry a "Restaurants" path, which is what
 * separates the two sets in the first place.)
 */
function categoryNamesFrom(categories: string | null): string[] {
  return splitSemicolonList(categories).filter(
    (name) => name && !/^(restaurants?|suppliers?)$/i.test(name),
  );
}

async function main() {
  const wb = XLSX.readFile(legacyPath("resutaurants.xlsx"));
  const rows = XLSX.utils.sheet_to_json<ProductRow>(wb.Sheets["Product"]!);
  const supplierRows = rows.filter(
    (r) => r.Name && !r.Categories?.includes("Restaurant"),
  );

  console.log(`Found ${supplierRows.length} supplier rows (of ${rows.length} total products).`);

  const nextSlug = makeUniqueSlugger();
  const categories = await db.supplierCategory.findMany();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  const governorates = await db.governorate.findMany();
  const govBySlug = new Map(governorates.map((g) => [g.slug, g]));

  let published = 0;
  let drafted = 0;
  let categoryLinked = 0;
  let unmatchedCategories = new Set<string>();

  for (const row of supplierRows) {
    const slug = nextSlug(row.Name);
    const status = row.Published ? "PUBLISHED" : "DRAFT";
    if (status === "PUBLISHED") published++;
    else drafted++;

    const govText = `${row.ShortDescription ?? ""} ${row.FullDescription ?? ""}`;
    const govSlug = guessGovernorateSlug(govText);
    const governorate = govSlug ? govBySlug.get(govSlug) : undefined;

    // Same quirk as the restaurant import: the export's ShortDescription
    // column holds the address, not prose.
    const supplier = await db.supplier.upsert({
      where: { slug },
      update: {
        name: row.Name,
        shortDescription: row.ShortDescription ?? null,
        fullDescriptionHtml: sanitize(row.FullDescription),
        addressText: row.ShortDescription ?? null,
        governorateId: governorate?.id,
        status,
        source: "LEGACY_IMPORT",
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
      },
    });

    for (const name of categoryNamesFrom(row.Categories)) {
      const category = categoryBySlug.get(slugify(name));
      if (!category) {
        unmatchedCategories.add(name);
        continue;
      }
      await db.supplierCategoryMap.upsert({
        where: { supplierId_categoryId: { supplierId: supplier.id, categoryId: category.id } },
        update: {},
        create: { supplierId: supplier.id, categoryId: category.id },
      });
      categoryLinked++;
    }
  }

  console.log(`✓ suppliers: ${published + drafted} (published=${published}, draft=${drafted})`);
  console.log(`  category links: ${categoryLinked}`);
  if (unmatchedCategories.size) {
    console.warn(`! unmatched categories: ${[...unmatchedCategories].join(", ")}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
