/**
 * Rollback net for `npm run migrate:images`.
 *
 * Only restaurant_images carries a `legacyPath` column, so a migration of the
 * other tables (people, resources, classification standards, magazine issues)
 * is one-way: once the row holds a Cloudinary URL there is no record of where
 * the file used to live. This records that mapping first.
 *
 *   node scripts/media-url-snapshot.mjs            write the snapshot
 *   node scripts/media-url-snapshot.mjs --restore  put the old paths back
 *
 * Run it with the same env as the migration, e.g.
 *   npx dotenv -e .env.production.local -- node scripts/media-url-snapshot.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const RESTORE = process.argv.includes("--restore");
const FILE = path.join(process.cwd(), "media-url-snapshot.json");

/** Must stay in step with TARGETS in prisma/seed/10-migrate-images-to-cloudinary.ts. */
const TARGETS = [
  ["restaurantImage", "url"],
  ["supplierImage", "url"],
  ["marketplaceListingImage", "url"],
  ["mediaGalleryItem", "imageUrl"],
  ["newsArticle", "coverImageUrl"],
  ["event", "coverImageUrl"],
  ["classificationStandard", "sourcePdfUrl"],
  ["legalDocumentVersion", "fileUrl"],
  ["magazineIssue", "coverImageUrl"],
  ["magazineIssue", "pdfUrl"],
  ["course", "coverImageUrl"],
  ["resource", "fileUrl"],
  ["resource", "coverImageUrl"],
  ["person", "photoUrl"],
];

async function snapshot() {
  const entries = [];
  for (const [model, field] of TARGETS) {
    const all = await db[model].findMany({ select: { id: true, [field]: true } });
    for (const row of all) {
      const v = row[field];
      // Local paths only — an https row is already migrated and needs no record.
      if (typeof v === "string" && v.length > 0 && !v.startsWith("http")) {
        entries.push({ model, field, id: row.id, url: v });
      }
    }
  }
  fs.writeFileSync(FILE, JSON.stringify(entries, null, 2));
  console.log(`wrote ${entries.length} rows to ${path.basename(FILE)}`);
  for (const [model, field] of TARGETS) {
    const n = entries.filter((e) => e.model === model && e.field === field).length;
    if (n) console.log(`  ${model}.${field}: ${n}`);
  }
}

async function restore() {
  if (!fs.existsSync(FILE)) {
    console.error(`✗ ${path.basename(FILE)} not found — nothing to restore from`);
    process.exit(1);
  }
  const entries = JSON.parse(fs.readFileSync(FILE, "utf8"));
  let n = 0;
  for (const e of entries) {
    await db[e.model].update({ where: { id: e.id }, data: { [e.field]: e.url } });
    n++;
    if (n % 50 === 0) console.log(`  ${n}/${entries.length}`);
  }
  console.log(`restored ${n} rows`);
}

(RESTORE ? restore() : snapshot())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
