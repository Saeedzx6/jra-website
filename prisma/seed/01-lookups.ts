/**
 * Seeds shared lookups: governorates, cuisines (from manufacturers.xlsx),
 * amenity tags (from restaurant_tags.xlsx), and supplier categories (from
 * categories.xlsx — Suppliers subtree only; the dead Resume/HR subtree and
 * unrelated legacy top-level categories are discarded, per plan §4 Step 1).
 */
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { GOVERNORATES, legacyPath, slugify } from "./util";

type CategoryRow = {
  Id: number;
  Name: string;
  ParentCategoryId: number;
};

async function seedGovernorates() {
  for (const g of GOVERNORATES) {
    await db.governorate.upsert({
      where: { slug: g.slug },
      update: { nameEn: g.nameEn, nameAr: g.nameAr },
      create: { slug: g.slug, nameEn: g.nameEn, nameAr: g.nameAr },
    });
  }
  console.log(`✓ governorates: ${GOVERNORATES.length}`);
}

async function seedCuisines() {
  const wb = XLSX.readFile(legacyPath("manufacturers.xlsx"));
  const rows = XLSX.utils.sheet_to_json<{ Id: number; Name: string }>(wb.Sheets["Manufacturer"]!);

  let count = 0;
  for (const row of rows) {
    if (!row.Name) continue;
    const slug = slugify(row.Name);
    await db.cuisine.upsert({
      where: { slug },
      update: { nameEn: row.Name },
      create: { slug, nameEn: row.Name },
    });
    count++;
  }
  console.log(`✓ cuisines: ${count}`);
}

async function seedAmenityTags() {
  const wb = XLSX.readFile(legacyPath("restaurant_tags.xlsx"));
  const rows = XLSX.utils.sheet_to_json<{ Tag: string }>(wb.Sheets["Tags"]!);

  const seen = new Map<string, string>(); // normalized -> display name (first occurrence, Title Case preferred)
  for (const row of rows) {
    if (!row.Tag) continue;
    const normalized = row.Tag.trim().toLowerCase();
    if (!normalized) continue;
    const existing = seen.get(normalized);
    // Prefer the variant that looks Title Case (has an uppercase first letter)
    if (!existing || (/^[A-Z]/.test(row.Tag.trim()) && !/^[A-Z]/.test(existing))) {
      seen.set(normalized, row.Tag.trim());
    }
  }

  let count = 0;
  for (const [normalized, display] of seen) {
    const slug = slugify(normalized);
    if (!slug) continue;
    await db.amenityTag.upsert({
      where: { slug },
      update: { nameEn: display },
      create: { slug, nameEn: display, kind: "AMENITY" },
    });
    count++;
  }
  console.log(`✓ amenity tags: ${count} (deduped from ${rows.length} rows)`);
}

async function seedSupplierCategories() {
  const wb = XLSX.readFile(legacyPath("categories.xlsx"));
  const rows = XLSX.utils.sheet_to_json<CategoryRow>(wb.Sheets["Category"]!);
  const byId = new Map(rows.map((r) => [r.Id, r]));

  function isUnderSuppliers(row: CategoryRow): boolean {
    let current: CategoryRow | undefined = row;
    let guard = 0;
    while (current && guard++ < 20) {
      if (current.Id === 2) return true; // Suppliers root
      current = current.ParentCategoryId ? byId.get(current.ParentCategoryId) : undefined;
    }
    return false;
  }

  const keep = rows.filter((r) => r.Id !== 2 && isUnderSuppliers(r));
  const slugById = new Map<number, string>();
  const uniq = new Set<string>();

  // First pass: assign slugs
  for (const row of keep) {
    let slug = slugify(row.Name);
    while (uniq.has(slug)) slug = `${slug}-${row.Id}`;
    uniq.add(slug);
    slugById.set(row.Id, slug);
  }

  // Insert parents before children (top-level = direct child of Suppliers root)
  const sorted = [...keep].sort((a, b) => (a.ParentCategoryId === 2 ? -1 : 1));
  for (const row of sorted) {
    const slug = slugById.get(row.Id)!;
    const parentSlug = row.ParentCategoryId !== 2 ? slugById.get(row.ParentCategoryId) : undefined;
    const parent = parentSlug
      ? await db.supplierCategory.findUnique({ where: { slug: parentSlug } })
      : null;

    await db.supplierCategory.upsert({
      where: { slug },
      update: { nameEn: row.Name, parentId: parent?.id ?? null },
      create: { slug, nameEn: row.Name, parentId: parent?.id ?? null },
    });
  }
  console.log(`✓ supplier categories: ${keep.length} (dead Resume/HR subtree discarded)`);
}

async function main() {
  await seedGovernorates();
  await seedCuisines();
  await seedAmenityTags();
  await seedSupplierCategories();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
