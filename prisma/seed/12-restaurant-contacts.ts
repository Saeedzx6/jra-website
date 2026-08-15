/**
 * Backfills restaurant contact details from the scraped jra.jo export.
 *
 * Why this exists: the directory was seeded from `resutaurants.xlsx`, a
 * nopCommerce product export whose columns are Name, descriptions, categories
 * and pictures — it carries no contact data at all. As a result every one of
 * the 701 published listings had a null phone, email, website, WhatsApp and
 * opening-hours field, and the profile page rendered a "Contact" heading over
 * nothing. The data was never actually missing: it sits in
 * `JRA-moreassets/jra_restaurants_data_full.csv`, which the seed pipeline
 * does not read.
 *
 * Safety:
 *  - Dry run unless `--write` is passed. Nothing is written by default.
 *  - Never overwrites a value that is already set; only fills nulls.
 *  - Matching is conservative. Exact normalised name first, then a bounded
 *    edit-distance pass, and any name whose best match is ambiguous (two
 *    candidates within the same distance) is skipped rather than guessed.
 *    Attaching the wrong phone number to a restaurant is worse than leaving
 *    it blank.
 *
 * Usage:
 *   npm run seed:contacts           # dry run, prints a report
 *   npm run seed:contacts -- --write
 */

import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import levenshtein from "fast-levenshtein";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const db = new PrismaClient();
const WRITE = process.argv.includes("--write");

const CSV_NAME = "jra_restaurants_data_full.csv";
const SEARCH_ROOTS = [
  process.env.JRA_ASSETS_DATA_DIR,
  "C:/Users/dvd/Desktop/project/JRA-moreassets",
].filter(Boolean) as string[];

function findCsv(): string {
  for (const root of SEARCH_ROOTS) {
    let hit: string | null = null;
    try {
      (function walk(d: string) {
        for (const n of readdirSync(d)) {
          const p = join(d, n);
          if (statSync(p).isDirectory()) walk(p);
          else if (n === CSV_NAME) hit = p;
        }
      })(root);
    } catch {
      continue;
    }
    if (hit) return hit;
  }
  throw new Error(`${CSV_NAME} not found under: ${SEARCH_ROOTS.join(", ")}`);
}

/**
 * Values carry an Arabic label prefix, e.g. "الهاتف:+962 6 554 4150".
 * Splitting on the first colon would also mangle "https://…" and "07:00 AM",
 * so only strip when the text before the colon is actually an Arabic label.
 */
const ARABIC = /[\u0600-\u06FF]/;
function clean(value: string | null | undefined): string | null {
  if (!value) return null;
  let s = String(value).trim();
  if (!s || s === "N/A" || s === "-") return null;
  if (!/^https?:\/\//i.test(s)) {
    const i = s.indexOf(":");
    if (i > 0 && i < 40 && ARABIC.test(s.slice(0, i))) s = s.slice(i + 1).trim();
  }
  return s || null;
}

/**
 * Normalisation for matching. Folds the Arabic orthographic variants that
 * otherwise cause obvious names to miss each other (أ/إ/آ → ا, ة → ه,
 * ى → ي) and strips diacritics, plus the usual case/space/punctuation work.
 */
function norm(value: string | null | undefined): string {
  if (!value) return "";
  return String(value)
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[’'`".,()\-–—_&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Phones are stored as digits plus a leading +, so they render consistently. */
function cleanPhone(value: string | null): string | null {
  if (!value) return null;
  const first = (value.split(/[,/|]/)[0] ?? "").trim();
  const digits = first.replace(/[^\d+]/g, "");
  return digits.length >= 8 ? digits : null;
}

function cleanUrl(value: string | null): string | null {
  if (!value) return null;
  const s = value.trim();
  if (!/^https?:\/\//i.test(s)) return null;
  return s.split(/\s+/)[0] ?? null;
}

function cleanEmail(value: string | null): string | null {
  if (!value) return null;
  const m = value.match(/[^\s,;]+@[^\s,;]+\.[a-z]{2,}/i);
  return m ? m[0].toLowerCase() : null;
}

/**
 * The reliable join. Directory names are English-only while ~56% of the CSV
 * rows are named in Arabic, so string matching alone reaches barely a third of
 * them. The scraped image filenames, however, embed the same slug the database
 * uses — "0006013_abu-jbara_600.png" -> "abu-jbara" -> Restaurant.slug — which
 * survives the language difference entirely.
 */
function slugFromImage(url: string): string | null {
  const withoutQuery = String(url || "").split(/[?#]/)[0] ?? "";
  const file = withoutQuery.split("/").pop() ?? "";
  const m = file.match(/^\d+[_-](.+?)(?:_\d{2,4})?\.(?:png|jpe?g|webp|gif)$/i);
  const slug = m?.[1];
  return slug ? slug.toLowerCase() : null;
}

function csvSlugs(row: Record<string, string>): string[] {
  return [
    ...new Set(
      String(row.Image_URLs || "")
        .split(/[\s,|]+/)
        .map(slugFromImage)
        .filter((s): s is string => Boolean(s))
    ),
  ];
}

type Row = Record<string, string>;

async function main() {
  const csvPath = findCsv();
  const rows: Row[] = parse(readFileSync(csvPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  const restaurants = await db.restaurant.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      nameAr: true,
      phone: true,
      email: true,
      whatsapp: true,
      openingHoursText: true,
      facebookUrl: true,
      instagramUrl: true,
      addressText: true,
    },
  });
  const bySlug = new Map(restaurants.map((r) => [r.slug, r.id]));
  const slugList = restaurants.map((r) => r.slug);

  // Index by both name forms. A name that maps to more than one restaurant is
  // dropped from the exact index — ambiguous is the same as unmatched here.
  const exact = new Map<string, string | null>();
  for (const r of restaurants) {
    for (const key of [norm(r.name), norm(r.nameAr)]) {
      if (!key) continue;
      exact.set(key, exact.has(key) ? null : r.id);
    }
  }
  const byId = new Map(restaurants.map((r) => [r.id, r]));
  const candidates = restaurants.flatMap((r) =>
    [norm(r.name), norm(r.nameAr)].filter(Boolean).map((key) => ({ key, id: r.id }))
  );

  const stats = {
    matchedSlug: 0,
    matchedSlugFuzzy: 0,
    matchedExact: 0,
    matchedFuzzy: 0,
    ambiguous: 0,
    unmatched: 0,
    updated: 0,
    fields: {} as Record<string, number>,
  };
  const bump = (f: string) => (stats.fields[f] = (stats.fields[f] ?? 0) + 1);
  const unmatchedNames: string[] = [];

  for (const row of rows) {
    const key = norm(row.Name);
    if (!key) continue;

    // 1. Image slug — the strongest signal, and language-independent.
    let id: string | null | undefined;
    const slugs = csvSlugs(row);
    for (const s of slugs) {
      if (bySlug.has(s)) {
        id = bySlug.get(s);
        stats.matchedSlug++;
        break;
      }
    }

    // 2. Near-miss slug (e.g. "buffalo-wings-rings" vs "buffalo-wings-and-rings").
    if (id === undefined && slugs.length) {
      let best: { id: string; d: number } | null = null;
      let tie = false;
      for (const s of slugs) {
        const limit = Math.min(4, Math.floor(s.length * 0.2));
        if (limit < 1) continue;
        for (const cand of slugList) {
          if (Math.abs(cand.length - s.length) > limit) continue;
          const d = levenshtein.get(cand, s);
          if (d > limit) continue;
          const candId = bySlug.get(cand)!;
          if (!best || d < best.d) {
            best = { id: candId, d };
            tie = false;
          } else if (d === best.d && candId !== best.id) {
            tie = true;
          }
        }
      }
      if (best && !tie) {
        id = best.id;
        stats.matchedSlugFuzzy++;
      }
    }

    // 3. Fall back to the name index for rows with no usable image slug.
    if (id === undefined) {
      id = exact.get(key);
      if (id) stats.matchedExact++;
    }

    if (id === undefined) {
      // Bounded edit distance: at most 15% of the name's length, capped at 3.
      // Anything looser starts matching genuinely different restaurants.
      const limit = Math.min(3, Math.floor(key.length * 0.15));
      let best: { id: string; d: number } | null = null;
      let tie = false;
      if (limit >= 1) {
        for (const c of candidates) {
          if (Math.abs(c.key.length - key.length) > limit) continue;
          const d = levenshtein.get(c.key, key);
          if (d > limit) continue;
          if (!best || d < best.d) {
            best = { id: c.id, d };
            tie = false;
          } else if (d === best.d && c.id !== best.id) {
            tie = true;
          }
        }
      }
      if (best && !tie) {
        id = best.id;
        stats.matchedFuzzy++;
      } else if (tie) {
        stats.ambiguous++;
        continue;
      } else {
        stats.unmatched++;
        if (unmatchedNames.length < 8) unmatchedNames.push(row.Name ?? "(unnamed)");
        continue;
      }
    }

    if (id === null) {
      stats.ambiguous++;
      continue;
    }

    const current = byId.get(id)!;
    const data: Record<string, string> = {};

    // The directory has no Arabic names at all (nameAr is null on every row),
    // so the Arabic site renders English restaurant names throughout. Where the
    // CSV names a restaurant in Arabic, that is the missing translation.
    const csvName = String(row.Name || "").trim();
    if (csvName && ARABIC.test(csvName) && !current.nameAr) {
      data.nameAr = csvName;
      bump("nameAr");
    }

    const phone = cleanPhone(clean(row.Phone));
    if (phone && !current.phone) (data.phone = phone), bump("phone");

    const email = cleanEmail(clean(row.Email));
    if (email && !current.email) (data.email = email), bump("email");

    const hours = clean(row.Opening_Hours);
    if (hours && !current.openingHoursText)
      (data.openingHoursText = hours), bump("openingHoursText");

    const fb = cleanUrl(clean(row.Facebook));
    if (fb && !current.facebookUrl) (data.facebookUrl = fb), bump("facebookUrl");

    const ig = cleanUrl(clean(row.Instagram));
    if (ig && !current.instagramUrl) (data.instagramUrl = ig), bump("instagramUrl");

    const address = clean(row.Location);
    if (address && !current.addressText) (data.addressText = address), bump("addressText");

    if (Object.keys(data).length === 0) continue;
    stats.updated++;
    if (WRITE) await db.restaurant.update({ where: { id }, data });
  }

  console.log(`source: ${csvPath}`);
  console.log(`csv rows: ${rows.length}   restaurants in db: ${restaurants.length}\n`);
  console.log(`matched by image slug : ${stats.matchedSlug}`);
  console.log(`matched by near slug  : ${stats.matchedSlugFuzzy}`);
  console.log(`matched by name       : ${stats.matchedExact}`);
  console.log(`matched by near name  : ${stats.matchedFuzzy}`);
  console.log(`ambiguous             : ${stats.ambiguous}  (skipped on purpose)`);
  console.log(`unmatched             : ${stats.unmatched}`);
  console.log(`\nrestaurants that would gain data: ${stats.updated}`);
  console.log("fields filled:");
  for (const [f, n] of Object.entries(stats.fields).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${f.padEnd(20)} ${n}`);
  }
  if (unmatchedNames.length) {
    console.log(`\nsample unmatched names: ${unmatchedNames.join(" | ")}`);
  }
  console.log(
    WRITE ? "\nWRITE MODE — changes committed." : "\nDRY RUN — nothing written. Re-run with --write to apply."
  );

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
