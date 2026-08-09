/**
 * Matches the real photos recovered in JRA-moreassets/JRA/JRA_Images (1,356
 * files covering ~398 businesses) to restaurant records by fuzzy name match,
 * and copies matched files into /public/uploads so they're servable
 * immediately in dev without Cloudinary. See plan §4 Step 3.
 *
 * Filenames are a mix of English and Arabic business names; this pass only
 * reliably matches the English-named subset — Arabic-named image groups are
 * reported as unmatched, exactly the manual-review gap flagged as Risk #3
 * in the plan. Re-run is idempotent (skips restaurants that already have
 * an image).
 */
import fs from "node:fs";
import path from "node:path";
import levenshtein from "fast-levenshtein";
import { db } from "@/lib/db";
import { assetsPath } from "./util";

const IMAGES_DIR = assetsPath("JRA_Images");
const PUBLIC_DIR = path.join(process.cwd(), "public", "uploads", "restaurants");

function stripSuffix(filename: string): { base: string; ext: string } {
  const ext = path.extname(filename);
  const withoutExt = filename.slice(0, -ext.length || undefined);
  const base = withoutExt.replace(/_\d+$/, "");
  return { base, ext };
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

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found: ${IMAGES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(IMAGES_DIR).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  const groups = new Map<string, string[]>();
  for (const file of files) {
    const { base } = stripSuffix(file);
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base)!.push(file);
  }

  const restaurants = await db.restaurant.findMany({
    where: { images: { none: {} } },
    select: { id: true, slug: true, name: true },
  });

  console.log(`${groups.size} image groups, ${restaurants.length} restaurants without images.`);

  // Seed usedGroups from any prior run so re-running this script never
  // double-assigns an image group already attached to a different restaurant.
  const priorlyUsed = await db.restaurantImage.findMany({
    where: { legacyPath: { not: null } },
    select: { legacyPath: true },
  });
  const usedGroups = new Set<string>();
  for (const row of priorlyUsed) {
    const filename = path.basename(row.legacyPath!);
    usedGroups.add(stripSuffix(filename).base);
  }

  async function assign(restaurant: { id: string; slug: string }, base: string) {
    usedGroups.add(base);
    const groupFiles = groups.get(base)!.slice(0, 5);
    const destDir = path.join(PUBLIC_DIR, restaurant.slug);
    fs.mkdirSync(destDir, { recursive: true });

    for (let i = 0; i < groupFiles.length; i++) {
      const srcFile = groupFiles[i]!;
      const ext = path.extname(srcFile);
      const destFile = `fuzzy-${i + 1}${ext}`;
      fs.copyFileSync(path.join(IMAGES_DIR, srcFile), path.join(destDir, destFile));

      await db.restaurantImage.create({
        data: {
          restaurantId: restaurant.id,
          url: `/uploads/restaurants/${restaurant.slug}/${destFile}`,
          isPrimary: i === 0,
          sortOrder: i,
          legacyPath: path.join(IMAGES_DIR, srcFile),
        },
      });
    }
  }

  function findBest(name: string, threshold: number): string | null {
    let best: { base: string; score: number } | null = null;
    for (const base of groups.keys()) {
      if (usedGroups.has(base)) continue;
      const score = similarity(base, name);
      if (score > threshold && (!best || score > best.score)) {
        best = { base, score };
      }
    }
    return best?.base ?? null;
  }

  let matched = 0;
  const stillUnmatched: typeof restaurants = [];

  // Pass 1: high-confidence matches.
  for (const restaurant of restaurants) {
    const base = findBest(restaurant.name, 0.82);
    if (base) {
      await assign(restaurant, base);
      matched++;
    } else {
      stillUnmatched.push(restaurant);
    }
  }

  // Pass 2: looser threshold for whatever's left, to maximize coverage —
  // still name-based, just less strict, since a plausibly-close real photo
  // beats a placeholder when the alternative is nothing at all.
  let looseMatched = 0;
  for (const restaurant of stillUnmatched) {
    const base = findBest(restaurant.name, 0.55);
    if (base) {
      await assign(restaurant, base);
      looseMatched++;
    }
  }

  console.log(`✓ matched images for ${matched} restaurants (high-confidence) + ${looseMatched} (loose match).`);
  console.log(`  ${stillUnmatched.length - looseMatched} restaurants still have no image match (likely Arabic-named files, or no photo exists in either source).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
