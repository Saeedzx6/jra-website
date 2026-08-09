/**
 * Second real-photo pass, for restaurants still without any image after
 * 07-restaurant-photos.ts (xlsx Picture1/2/3) and 03-images.ts (fuzzy
 * JRA_Images match). jra_restaurants_data_full.csv (645 Arabic-scraped rows)
 * turns out to carry the same "{numericId}_{english-slug}.ext" CDN filename
 * convention as the xlsx export — meaning every CSV row has a stable
 * English-ish slug we can fuzzy-match against our (English) restaurant
 * names, sidestepping the Arabic/English cross-script matching problem
 * entirely. Downloads from the same live jra.jo CDN as 07.
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import levenshtein from "fast-levenshtein";
import { db } from "@/lib/db";
import { assetsPath } from "./util";

const PUBLIC_DIR = path.join(process.cwd(), "public", "uploads", "restaurants");

function slugFromCdnUrl(url: string): string | null {
  const filename = url.split("/").pop();
  if (!filename) return null;
  const noExt = filename.replace(/\.(png|jpe?g|webp)$/i, "");
  const withoutId = noExt.replace(/^\d+_/, "");
  const withoutSize = withoutId.replace(/_\d{2,4}$/, "");
  return withoutSize || null;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  const dist = levenshtein.get(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return 1 - dist / maxLen;
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) return false;
    fs.writeFileSync(destPath, buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const csvPath = assetsPath("jra_restaurants_data_full.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows: { Name: string; Image_URLs: string }[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
  });

  // slug -> ordered, deduped list of CDN URLs
  const slugToUrls = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.Image_URLs || row.Image_URLs === "N/A") continue;
    const urls = row.Image_URLs.split("|").map((u) => u.trim()).filter(Boolean);
    for (const url of urls) {
      const slug = slugFromCdnUrl(url);
      if (!slug) continue;
      if (!slugToUrls.has(slug)) slugToUrls.set(slug, []);
      const list = slugToUrls.get(slug)!;
      if (!list.includes(url)) list.push(url);
    }
  }
  console.log(`${slugToUrls.size} distinct slugs extracted from ${rows.length} CSV rows.`);

  const restaurants = await db.restaurant.findMany({
    where: { images: { none: {} } },
    select: { id: true, slug: true, name: true },
  });
  console.log(`${restaurants.length} restaurants still without any image.`);

  const usedSlugs = new Set<string>();
  let matched = 0;
  let imagesSaved = 0;

  for (const restaurant of restaurants) {
    let best: { slug: string; score: number } | null = null;
    for (const slug of slugToUrls.keys()) {
      if (usedSlugs.has(slug)) continue;
      const score = similarity(slug, restaurant.name);
      if (score > 0.72 && (!best || score > best.score)) {
        best = { slug, score };
      }
    }
    if (!best) continue;
    usedSlugs.add(best.slug);

    const urls = slugToUrls.get(best.slug)!.slice(0, 5);
    const destDir = path.join(PUBLIC_DIR, restaurant.slug);
    fs.mkdirSync(destDir, { recursive: true });

    let saved = 0;
    for (let i = 0; i < urls.length; i++) {
      const ext = path.extname(new URL(urls[i]!).pathname) || ".jpg";
      const destFile = `csv-${i + 1}${ext}`;
      const ok = await downloadImage(urls[i]!, path.join(destDir, destFile));
      if (ok) {
        await db.restaurantImage.create({
          data: {
            restaurantId: restaurant.id,
            url: `/uploads/restaurants/${restaurant.slug}/${destFile}`,
            isPrimary: saved === 0,
            sortOrder: saved,
          },
        });
        saved++;
      }
    }
    if (saved > 0) {
      matched++;
      imagesSaved += saved;
    }
  }

  console.log(`✓ matched ${matched}/${restaurants.length} remaining restaurants, ${imagesSaved} images saved.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
