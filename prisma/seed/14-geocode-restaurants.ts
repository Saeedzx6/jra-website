/**
 * Geocodes restaurant addresses into latitude/longitude.
 *
 * The directory carries an address for ~92% of listings but no coordinates at
 * all, which is what blocks the map. This fills them in.
 *
 * Deliberately conservative about the upstream service:
 *  - One request per second by default. Nominatim's usage policy requires it,
 *    and bulk geocoding a whole dataset against their public instance is
 *    discouraged — run this in batches, or point GEOCODER_URL at your own
 *    instance or a paid provider.
 *  - Resumable. Rows that already have coordinates are skipped, so it can be
 *    stopped and restarted, and `--limit` caps a run.
 *  - Records where each coordinate came from (geocodeSource) and when, so a
 *    bad provider run can be identified and redone later.
 *  - Results below a confidence bar are left null rather than written. A
 *    restaurant pinned in the wrong city is worse than one not on the map.
 *
 * Usage:
 *   npm run seed:geocode -- --limit 25          # dry run, 25 rows
 *   npm run seed:geocode -- --limit 25 --write
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const WRITE = process.argv.includes("--write");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : 25;

const GEOCODER_URL = process.env.GEOCODER_URL ?? "https://nominatim.openstreetmap.org/search";
const RATE_LIMIT_MS = Number(process.env.GEOCODER_RATE_MS ?? 1100);
/** Nominatim requires a contact-identifying User-Agent. */
const USER_AGENT =
  process.env.GEOCODER_USER_AGENT ?? "jra-website/1.0 (https://jra.jo; admin@jra.jo)";

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

type GeocodeHit = {
  lat: number;
  lon: number;
  addressType: string;
  displayName: string;
  /** Locality components the provider returned, for cross-checking. */
  addressParts: string[];
};

/**
 * Cross-checks a result against the governorate already recorded for the
 * restaurant. Without this a name search happily returns a same-named place in
 * the wrong half of the country — a first run put an Aqaba restaurant near
 * Irbid, about 300km out. Inside-Jordan is not a tight enough bar.
 */
function agreesWithGovernorate(hit: GeocodeHit, governorate: string | null): boolean {
  if (!governorate) return true; // nothing to contradict
  const want = governorate.toLowerCase().replace(/\s+governorate$/, "").trim();
  const haystack = [...hit.addressParts, hit.displayName].join(" ").toLowerCase();
  return haystack.includes(want);
}

/**
 * Result types that describe an *area* rather than a place. Accepting these is
 * how a first attempt put eleven restaurants on the exact centroid of Amman —
 * the specific address failed, the query fell back to the city, and every row
 * got the same point. Anything in this set is discarded.
 */
const AREA_TYPES = new Set([
  "country",
  "state",
  "region",
  "province",
  "county",
  "municipality",
  "city",
  "town",
  "village",
  "suburb",
  "quarter",
  "neighbourhood",
  "city_district",
  "district",
  "postcode",
  "administrative",
]);

async function geocode(query: string): Promise<GeocodeHit | null> {
  const url = new URL(GEOCODER_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "jo");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" } });
  if (res.status === 429) throw new Error("rate_limited");
  if (!res.ok) return null;

  const body = (await res.json()) as Array<{
    lat: string;
    lon: string;
    addresstype?: string;
    type?: string;
    display_name?: string;
    address?: Record<string, string>;
  }>;
  const hit = body[0];
  if (!hit) return null;

  const lat = Number(hit.lat);
  const lon = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return {
    lat,
    lon,
    addressType: hit.addresstype ?? hit.type ?? "",
    displayName: hit.display_name ?? "",
    addressParts: Object.values(hit.address ?? {}),
  };
}

/**
 * The scraped addresses use pipes as separators — "Arar St. | Wadi Saqra |
 * Amman Jordan" — which no geocoder parses. Converting them to commas is the
 * single biggest factor in whether a specific address resolves at all.
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
 * a governorate. A governorate-only query cannot return anything except a
 * centroid, so it is not asked.
 */
function queriesFor(r: {
  name: string;
  addressText: string | null;
  areaName: string | null;
  governorateName: string | null;
}): string[] {
  const address = r.addressText ? normaliseAddress(r.addressText) : null;
  const out: string[] = [];

  // Restaurants are points of interest in OSM, and street-address coverage in
  // Jordan is thin, so the name plus a locality often resolves where the
  // address alone does not.
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

  console.log(`geocoder : ${GEOCODER_URL}`);
  console.log(`rate     : one request per ${RATE_LIMIT_MS}ms`);
  console.log(`candidates without coordinates: ${rows.length} (limit ${LIMIT})\n`);

  let resolved = 0;
  let rejected = 0;
  let missed = 0;
  // Coordinate -> first restaurant that claimed it, for collision detection.
  const seen = new Map<string, string>();

  // Anything already on the map counts toward collision detection too.
  for (const existing of await db.restaurant.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    select: { name: true, latitude: true, longitude: true },
  })) {
    seen.set(`${existing.latitude!.toFixed(5)},${existing.longitude!.toFixed(5)}`, existing.name);
  }

  for (const r of rows) {
    const queries = queriesFor({
      name: r.name,
      addressText: r.addressText,
      areaName: r.area?.nameEn ?? null,
      governorateName: r.governorate?.nameEn ?? null,
    });

    let hit: GeocodeHit | null = null;
    for (const q of queries) {
      await sleep(RATE_LIMIT_MS);
      try {
        hit = await geocode(q);
      } catch (e) {
        if ((e as Error).message === "rate_limited") {
          console.log("  upstream rate limit hit — stopping. Re-run to continue.");
          break;
        }
        throw e;
      }
      if (hit) break;
    }

    if (!hit) {
      missed++;
      console.log(`  ·  ${r.name.slice(0, 44).padEnd(44)} no match`);
      continue;
    }
    if (!insideJordan(hit.lat, hit.lon)) {
      rejected++;
      console.log(`  ✗  ${r.name.slice(0, 44).padEnd(44)} outside Jordan`);
      continue;
    }
    if (AREA_TYPES.has(hit.addressType)) {
      rejected++;
      console.log(
        `  ✗  ${r.name.slice(0, 44).padEnd(44)} resolved only to a ${hit.addressType} — too coarse`
      );
      continue;
    }
    if (!agreesWithGovernorate(hit, r.governorate?.nameEn ?? null)) {
      rejected++;
      console.log(
        `  ✗  ${r.name.slice(0, 44).padEnd(44)} lands outside ${r.governorate?.nameEn} — wrong place`
      );
      continue;
    }
    // Safety net: if a coordinate has already been assigned in this run, the
    // provider is very likely returning a shared centroid.
    const coordKey = `${hit.lat.toFixed(5)},${hit.lon.toFixed(5)}`;
    if (seen.has(coordKey)) {
      rejected++;
      console.log(
        `  ✗  ${r.name.slice(0, 44).padEnd(44)} duplicate of ${seen.get(coordKey)} — centroid`
      );
      continue;
    }
    seen.set(coordKey, r.name);

    resolved++;
    console.log(
      `  ✓  ${r.name.slice(0, 44).padEnd(44)} ${hit.lat.toFixed(5)}, ${hit.lon.toFixed(5)}  (${hit.addressType})`
    );

    if (WRITE) {
      await db.restaurant.update({
        where: { id: r.id },
        data: {
          latitude: hit.lat,
          longitude: hit.lon,
          geocodeSource: new URL(GEOCODER_URL).hostname,
          geocodedAt: new Date(),
        },
      });
    }
  }

  const remaining = await db.restaurant.count({
    where: { latitude: null, addressText: { not: null } },
  });
  console.log(`\nresolved ${resolved}, rejected ${rejected}, no match ${missed}`);
  console.log(`still without coordinates: ${remaining - (WRITE ? resolved : 0)}`);
  console.log(WRITE ? "WRITE MODE — coordinates saved." : "DRY RUN — nothing written.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
