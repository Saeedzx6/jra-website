/**
 * Geocoding providers.
 *
 * Each returns the same shape so the backfill's safety checks — area-type
 * rejection, coordinate-collision detection and the governorate cross-check —
 * apply identically whichever service is in use.
 *
 * Selected with GEOCODER_PROVIDER: "nominatim" (default) or "google-places".
 */

export type GeocodeHit = {
  lat: number;
  lon: number;
  /** Normalised result granularity; "area" means a centroid, not a place. */
  granularity: "place" | "street" | "area" | "unknown";
  displayName: string;
  /** Locality strings for cross-checking against the known governorate. */
  addressParts: string[];
};

export type Provider = {
  name: string;
  /** Minimum gap between requests, in ms. */
  rateMs: number;
  /** Throws "rate_limited" to signal the caller should stop and resume later. */
  lookup(query: string): Promise<GeocodeHit | null>;
};

/** Nominatim types that describe an area rather than a specific place. */
const NOMINATIM_AREA_TYPES = new Set([
  "country", "state", "region", "province", "county", "municipality",
  "city", "town", "village", "suburb", "quarter", "neighbourhood",
  "city_district", "district", "postcode", "administrative",
]);

export function nominatim(): Provider {
  const url = process.env.GEOCODER_URL ?? "https://nominatim.openstreetmap.org/search";
  const userAgent =
    process.env.GEOCODER_USER_AGENT ?? "jra-website/1.0 (https://jra.jo; admin@jra.jo)";

  return {
    name: new URL(url).hostname,
    // Nominatim's usage policy requires no more than one request per second.
    rateMs: Number(process.env.GEOCODER_RATE_MS ?? 1100),
    async lookup(query) {
      const u = new URL(url);
      u.searchParams.set("q", query);
      u.searchParams.set("format", "jsonv2");
      u.searchParams.set("limit", "1");
      u.searchParams.set("countrycodes", "jo");
      u.searchParams.set("addressdetails", "1");

      const res = await fetch(u, {
        headers: { "User-Agent": userAgent, "Accept-Language": "en" },
      });
      if (res.status === 429) throw new Error("rate_limited");
      if (!res.ok) return null;

      const body = (await res.json()) as Array<{
        lat: string; lon: string; addresstype?: string; type?: string;
        display_name?: string; address?: Record<string, string>;
      }>;
      const hit = body[0];
      if (!hit) return null;

      const lat = Number(hit.lat);
      const lon = Number(hit.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

      const t = hit.addresstype ?? hit.type ?? "";
      return {
        lat,
        lon,
        granularity: NOMINATIM_AREA_TYPES.has(t) ? "area" : t === "road" ? "street" : "place",
        displayName: hit.display_name ?? "",
        addressParts: Object.values(hit.address ?? {}),
      };
    },
  };
}

/**
 * Google Places Text Search (Places API New).
 *
 * Chosen over the Geocoding API because the directory's addresses geocode
 * poorly while the restaurants themselves are well-covered business listings —
 * a name-plus-locality text search is what actually resolves them.
 *
 * Billed per request. Field masks are kept to the minimum needed, since the
 * mask determines the pricing tier.
 */
export function googlePlaces(): Provider {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error(
      "GOOGLE_MAPS_API_KEY is not set. Add it to .env.local — do not pass it on the command line."
    );
  }

  return {
    name: "places.googleapis.com",
    // Google permits far higher throughput than Nominatim; this is polite
    // rather than required, and keeps a runaway loop from burning budget.
    rateMs: Number(process.env.GEOCODER_RATE_MS ?? 120),
    async lookup(query) {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          // Only the fields actually used — the mask drives the price tier.
          "X-Goog-FieldMask":
            "places.location,places.formattedAddress,places.displayName,places.types,places.addressComponents",
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: "en",
          maxResultCount: 1,
          // Bias hard to Jordan; a same-named place abroad is the main risk.
          locationRestriction: {
            rectangle: {
              low: { latitude: 29.18, longitude: 34.95 },
              high: { latitude: 33.38, longitude: 39.31 },
            },
          },
        }),
      });

      if (res.status === 429) throw new Error("rate_limited");
      if (res.status === 403) throw new Error("forbidden — check the API key and enabled APIs");
      if (!res.ok) return null;

      const body = (await res.json()) as {
        places?: Array<{
          location?: { latitude: number; longitude: number };
          formattedAddress?: string;
          displayName?: { text?: string };
          types?: string[];
          addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>;
        }>;
      };

      const p = body.places?.[0];
      if (!p?.location) return null;

      const types = p.types ?? [];
      // Same rule as Nominatim: an administrative result is a centroid.
      const isArea = types.some((t) =>
        ["locality", "political", "administrative_area_level_1", "administrative_area_level_2",
         "country", "postal_code", "sublocality", "neighborhood"].includes(t)
      );
      const isPlace = types.some((t) =>
        ["restaurant", "cafe", "bar", "food", "point_of_interest", "establishment", "store"].includes(t)
      );

      return {
        lat: p.location.latitude,
        lon: p.location.longitude,
        granularity: isPlace ? "place" : isArea ? "area" : "unknown",
        displayName: p.formattedAddress ?? p.displayName?.text ?? "",
        addressParts: (p.addressComponents ?? []).flatMap((c) =>
          [c.longText, c.shortText].filter((v): v is string => Boolean(v))
        ),
      };
    },
  };
}

export function selectProvider(): Provider {
  const name = (process.env.GEOCODER_PROVIDER ?? "nominatim").toLowerCase();
  switch (name) {
    case "google":
    case "google-places":
      return googlePlaces();
    case "nominatim":
      return nominatim();
    default:
      throw new Error(`Unknown GEOCODER_PROVIDER "${name}" (use nominatim or google-places)`);
  }
}
