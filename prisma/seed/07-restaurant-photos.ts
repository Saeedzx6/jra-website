/**
 * Better photo coverage pass: the legacy xlsx export's Picture1/Picture2/
 * Picture3 fields looked like broken local Windows paths (e.g.
 * "G:\Inetpub\vhosts\jra.jo\httpdocs\content\images\thumbs\0017791_13c-
 * back-club.png"), but the FILENAME portion is still being served live from
 * jra.jo's CDN. This script re-reads the same restaurant rows (matched back
 * to our seeded restaurants via legacyProductId, which was set to the row
 * index during 02-restaurants.ts — no fuzzy matching needed, this is exact),
 * downloads the real photos, and replaces whatever 03-images.ts guessed.
 *
 * Covers 532 of 701 restaurants directly (vs. 100 from fuzzy filename
 * matching in JRA_Images). Restaurants with no Picture1 in the export still
 * fall back to the fuzzy JRA_Images match or a placeholder.
 */
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { legacyPath } from "./util";

type ProductRow = {
  Categories: string | null;
  Picture1: string | null;
  Picture2: string | null;
  Picture3: string | null;
};

const PUBLIC_DIR = path.join(process.cwd(), "public", "uploads", "restaurants");
const CDN_HOSTS = ["https://jra.jo/content/images/thumbs/", "https://www.jra.jo/content/images/thumbs/"];

function extractFilename(winPath: string | null): string | null {
  if (!winPath) return null;
  const parts = winPath.split(/[\\/]/);
  const filename = parts[parts.length - 1];
  return filename && /\.(png|jpe?g|webp)$/i.test(filename) ? filename : null;
}

async function downloadImage(filename: string, destPath: string): Promise<boolean> {
  for (const host of CDN_HOSTS) {
    try {
      const res = await fetch(host + filename);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 200) continue; // guard against error-page bodies
      fs.writeFileSync(destPath, buf);
      return true;
    } catch {
      // try next host
    }
  }
  return false;
}

async function processRestaurant(
  restaurant: { id: string; slug: string; legacyProductId: number | null },
  row: ProductRow
) {
  const filenames = [row.Picture1, row.Picture2, row.Picture3]
    .map(extractFilename)
    .filter((f): f is string => Boolean(f));
  if (filenames.length === 0) return { attempted: 0, saved: 0 };

  const destDir = path.join(PUBLIC_DIR, restaurant.slug);
  fs.mkdirSync(destDir, { recursive: true });

  let saved = 0;
  const newImages: { url: string; sortOrder: number }[] = [];

  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i]!;
    const ext = path.extname(filename) || ".jpg";
    const destFilename = `cdn-${i + 1}${ext}`;
    const destPath = path.join(destDir, destFilename);
    const ok = await downloadImage(filename, destPath);
    if (ok) {
      newImages.push({ url: `/uploads/restaurants/${restaurant.slug}/${destFilename}`, sortOrder: i });
      saved++;
    }
  }

  if (newImages.length > 0) {
    await db.restaurantImage.deleteMany({ where: { restaurantId: restaurant.id } });
    for (let i = 0; i < newImages.length; i++) {
      await db.restaurantImage.create({
        data: {
          restaurantId: restaurant.id,
          url: newImages[i]!.url,
          isPrimary: i === 0,
          sortOrder: newImages[i]!.sortOrder,
        },
      });
    }
  }

  return { attempted: filenames.length, saved };
}

async function main() {
  const wb = XLSX.readFile(legacyPath("resutaurants.xlsx"));
  const allRows = XLSX.utils.sheet_to_json<ProductRow>(wb.Sheets["Product"]!);
  const restaurantRows = allRows.filter((r) => r.Categories?.includes("Restaurant"));

  const restaurants = await db.restaurant.findMany({
    where: { legacyProductId: { not: null } },
    select: { id: true, slug: true, legacyProductId: true },
  });

  console.log(`${restaurants.length} restaurants to check against ${restaurantRows.length} legacy rows.`);

  let processed = 0;
  let totalSaved = 0;
  let restaurantsWithPhotos = 0;

  const CONCURRENCY = 8;
  let cursor = 0;

  async function worker() {
    while (cursor < restaurants.length) {
      const idx = cursor++;
      const restaurant = restaurants[idx]!;
      const row = restaurantRows[restaurant.legacyProductId!];
      if (!row) continue;
      const result = await processRestaurant(restaurant, row);
      if (result.saved > 0) restaurantsWithPhotos++;
      totalSaved += result.saved;
      processed++;
      if (processed % 50 === 0) console.log(`  ...${processed}/${restaurants.length} checked`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  console.log(`✓ done. ${restaurantsWithPhotos} restaurants got real CDN photos, ${totalSaved} images saved total.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
