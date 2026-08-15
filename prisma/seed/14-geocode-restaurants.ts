/**
 * Backfills restaurant coordinates.
 *
 * The directory carries an address for ~92% of listings but no coordinates at
 * all, which is what blocks the map.
 *
 * Provider-agnostic (see geocode-providers.ts). The safety checks below apply
 * whichever service is selected, and each one exists because an earlier run
 * wrote bad data without it:
 *
 *  - Area-type rejection. A first run put eleven restaurants on the exact
 *    centroid of Amman: the specific addresses failed, the query fell back to
 *    the city, and every row got the same point.
 *  - Coordinate-collision detection, as a backstop for the same failure
 *    against a different provider.
 *  - Governorate cross-check. A name search returned a same-named place in the
 *    wrong half of the country — an Aqaba restaurant pinned near Irbid, about
 *    300km out. "Inside Jordan" is not a tight enough bar.
 *
 * A restaurant pinned in the wrong place is worse than one absent from the
 * map, so anything failing a check is left null rather than written.
 *
 * Usage:
 *   npm run seed:geocode -- --limit 25                 # dry run
 *   npm run seed:geocode -- --limit 25 --write
 *   GEOCODER_PROVIDER=google-places npm run seed:geocode -- --limit 25 --write
 */

import { PrismaClient } from "@prisma/client";
import { selectProvider, type GeocodeHit } from "./geocode-providers";

const db = new PrismaClient();

const WRITE = process.argv.includes("--write");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : 25;

/** Jordan's bounding box. Anything outside it is a bad match, not a location. */
const JORDAN_BBOX = { minLat: 29.18, maxLat: 33.38, minLon: 34.95, maxLon: 39.31 };

function insideJordan(lat: number, lon: number): boolean {
  return (
    lat >= JORDAN_BBOX.minLat &&
    lat <= JORDAN_BBOX.maxLat &&
    lon >= JORDAN_BBOX.minLon &&
    lon <= JORDAN_BBOX.maxLon
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Cross-checks a result against the governorate already recorded. Without it a
 * name search happily returns a same-named place elsewhere in the country.
 */
function agreesWithGovernorate(hit: GeocodeHit, governorate: string | null): boolean {
  if (!governorate) return true;
  const want = governorate.toLowerCase().replace(/\s+governorate$/, "").trim();
  return [...hit.addressParts, hit.displayName].join(" ").toLowerCase().includes(want);
}

/**
 * The scraped addresses use pipes as separators — "Arar St. | Wadi Saqra |
 * Amman" — which no geocoder parses. Converting them to commas is the single
 * biggest factor in whether a specific address resolves at all.
 */
function normaliseAddress(value: string): string {
  return value
    .replace(/[|/\\]+/g, ", ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/(,\s*)+/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim();
}

/**
 * Progressively less specific queries — but never coarser than an area within
 * a governorate, since a governorate-only query can only return a centroid.
 *
 * Name first: OSM and Places both cover restaurants as businesses far better
 * than they cover Jordanian street addresses.
 */
function queriesFor(r: {
  name: string;
  addressText: string | null;
  areaName: string | null;
  governorateName: string | null;
}): string[] {
  const address = r.addressText ? normaliseAddress(r.addressText) : null;
  const out: string[] = [];

  const locality = r.areaName ?? r.governorateName;
  if (locality) out.push(`${r.name}, ${locality}, Jordan`);
  out.push(`${r.name}, Jordan`);

  if (address) {
    out.push(`${address}, Jordan`);
    if (r.governorateName && !address.toLowerCase().includes(r.governorateName.toLowerCase())) {
      out.push(`${address}, ${r.governorateName}, Jordan`);
    }
  }
  if (r.areaName && r.governorateName) out.push(`${r.areaName}, ${r.governorateName}, Jordan`);
  return [...new Set(out)];
}

async function main() {
  const provider = selectProvider();

  const rows = await db.restaurant.findMany({
    where: { latitude: null, addressText: { not: null } },
    select: {
      id: true,
      name: true,
      addressText: true,
      area: { select: { nameEn: true } },
      governorate: { select: { nameEn: true } },
    },
    take: LIMIT,
    orderBy: { name: "asc" },
  });

  console.log(`provider : ${provider.name}`);
  console.log(`rate     : one request per ${provider.rateMs}ms`);
  console.log(`mode     : ${WRITE ? "WRITE" : "dry run"}`);
  console.log(`candidates without coordinates: ${rows.length} (limit ${LIMIT})\n`);

  let resolved = 0;
  let rejected = 0;
  let missed = 0;
  let requests = 0;

  const seen = new Map<string, string>();
  for (const existing of await db.restaurant.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    select: { name: true, latitude: true, longitude: true },
  })) {
    seen.set(`${existing.latitude!.toFixed(5)},${existing.longitude!.toFixed(5)}`, existing.name);
  }

  outer: for (const r of rows) {
    const queries = queriesFor({
      name: r.name,
      addressText: r.addressText,
      areaName: r.area?.nameEn ?? null,
      governorateName: r.governorate?.nameEn ?? null,
    });

    let hit: GeocodeHit | null = null;
    for (const q of queries) {
      await sleep(provider.rateMs);
      requests++;
      try {
        hit = await provider.lookup(q);
      } catch (e) {
        const msg = (e as Error).message;
        if (msg === "rate_limited") {
          console.log("\n  upstream rate limit reached — stopping. Re-run to continue.");
          break outer;
        }
        throw e;
      }
      // Keep looking if the provider only offered an area centroid.
      if (hit && hit.granularity !== "area") break;
      if (hit) hit = null;
    }

    const label = r.name.slice(0, 42).padEnd(42);

    if (!hit) {
      missed++;
      console.log(`  ·  ${label} no match`);
      continue;
    }
    if (!insideJordan(hit.lat, hit.lon)) {
      rejected++;
      console.log(`  ✗  ${label} outside Jordan`);
      continue;
    }
    if (hit.granularity === "area") {
      rejected++;
      console.log(`  ✗  ${label} area centroid — too coarse`);
      continue;
    }
    if (!agreesWithGovernorate(hit, r.governorate?.nameEn ?? null)) {
      rejected++;
      console.log(`  ✗  ${label} lands outside ${r.governorate?.nameEn}`);
      continue;
    }
    const coordKey = `${hit.lat.toFixed(5)},${hit.lon.toFixed(5)}`;
    if (seen.has(coordKey)) {
      rejected++;
      console.log(`  ✗  ${label} duplicate of ${seen.get(coordKey)}`);
      continue;
    }
    seen.set(coordKey, r.name);

    resolved++;
    console.log(`  ✓  ${label} ${hit.lat.toFixed(5)}, ${hit.lon.toFixed(5)}  (${hit.granularity})`);

    if (WRITE) {
      await db.restaurant.update({
        where: { id: r.id },
        data: {
          latitude: hit.lat,
          longitude: hit.lon,
          geocodeSource: provider.name,
          geocodedAt: new Date(),
        },
      });
    }
  }

  const withCoords = await db.restaurant.count({ where: { latitude: { not: null } } });
  const total = await db.restaurant.count({ where: { status: "PUBLISHED" } });

  console.log(`\nresolved ${resolved}, rejected ${rejected}, no match ${missed}`);
  console.log(`upstream requests made: ${requests}`);
  console.log(`coverage: ${withCoords} / ${total} (${((withCoords / total) * 100).toFixed(1)}%)`);
  console.log(WRITE ? "WRITE MODE — coordinates saved." : "DRY RUN — nothing written.");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
