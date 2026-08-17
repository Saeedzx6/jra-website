import { describe, it, expect } from "vitest";
import {
  restaurants,
  suppliers,
  vocab,
  filterEntries,
  suggest,
  featuredRestaurants,
  getRestaurant,
  getSupplier,
  photosOf,
  mapsUrl,
  type Restaurant,
} from "@/lib/directory";

/**
 * These test the CONTRACT between the generated snapshot
 * (scripts/generate-directory-data.ts) and the front end that reads it. The
 * generator rebuilds src/data/*.json from Prisma; if it ever emits a different
 * shape, the directory pages break at runtime with no type error to catch it,
 * because the JSON is imported and cast. So the shape is asserted here.
 */

describe("directory snapshot shape", () => {
  it("has restaurants and suppliers", () => {
    expect(restaurants.length).toBeGreaterThan(0);
    expect(suppliers.length).toBeGreaterThan(0);
  });

  it("gives every restaurant the fields the card and detail page read", () => {
    for (const r of restaurants) {
      expect(typeof r.slug).toBe("string");
      expect(r.slug.length).toBeGreaterThan(0);
      expect(typeof r.name).toBe("string");
      expect(typeof r.address).toBe("string");
      expect(typeof r.city).toBe("string");
      expect(typeof r.blurb).toBe("string");
      expect(typeof r.cuisine).toBe("string");
      expect(Array.isArray(r.tags)).toBe(true);
      // The three flat image slots are always present, possibly empty.
      expect(typeof r.logo).toBe("string");
      expect(typeof r.image).toBe("string");
      expect(typeof r.image2).toBe("string");
    }
  });

  it("gives every supplier a trade field", () => {
    for (const s of suppliers) {
      expect(typeof s.slug).toBe("string");
      expect(typeof s.trade).toBe("string");
    }
  });

  it("keeps slugs unique, since they are the detail-page routes", () => {
    const rSlugs = restaurants.map((r) => r.slug);
    const sSlugs = suppliers.map((s) => s.slug);
    expect(new Set(rSlugs).size).toBe(rSlugs.length);
    expect(new Set(sSlugs).size).toBe(sSlugs.length);
  });

  it("never emits an address containing the export's pipe delimiter", () => {
    // The raw column is "Arar St. | Wadi Saqra | Amman"; the generator renders
    // it comma-separated. A pipe here means that step regressed.
    for (const r of restaurants) expect(r.address).not.toContain("|");
  });

  it("does not use the address as the blurb", () => {
    // The legacy import writes ShortDescription into BOTH shortDescription and
    // addressText, and in that export the column is the street address. Reading
    // it as the blurb produced cards whose body copy was their own address.
    const identical = restaurants.filter(
      (r) => r.blurb.length > 0 && r.blurb === r.address,
    );
    expect(identical).toHaveLength(0);
  });
});

describe("vocab", () => {
  it("lists only categories that some entry actually uses", () => {
    const usedCuisines = new Set(restaurants.map((r) => r.cuisine).filter(Boolean));
    for (const c of vocab.cuisines) expect(usedCuisines.has(c)).toBe(true);

    const usedTrades = new Set(suppliers.map((s) => s.trade).filter(Boolean));
    for (const t of vocab.trades) expect(usedTrades.has(t)).toBe(true);
  });

  it("reports totals that match the data", () => {
    expect(vocab.totals.restaurants).toBe(restaurants.length);
    expect(vocab.totals.suppliers).toBe(suppliers.length);
    expect(vocab.totals.cuisines).toBe(vocab.cuisines.length);
    expect(vocab.totals.trades).toBe(vocab.trades.length);
  });

  it("resolves every featured slug — the home rail is curated, not queried", () => {
    expect(vocab.featured.length).toBeGreaterThan(0);
    for (const slug of vocab.featured) expect(getRestaurant(slug)).toBeDefined();
    expect(featuredRestaurants()).toHaveLength(vocab.featured.length);
  });

  it("preserves the curated order of the featured rail", () => {
    expect(featuredRestaurants().map((r) => r.slug)).toEqual(vocab.featured);
  });
});

describe("lookups", () => {
  it("finds an entry by slug and misses cleanly", () => {
    const first = restaurants[0]!;
    expect(getRestaurant(first.slug)?.name).toBe(first.name);
    expect(getRestaurant("no-such-restaurant")).toBeUndefined();
    expect(getSupplier("no-such-supplier")).toBeUndefined();
  });
});

describe("filterEntries", () => {
  const sample: Restaurant[] = [
    {
      slug: "a",
      name: "Fakhr El-Din",
      address: "Jabal Amman",
      city: "Amman",
      tags: ["Parking", "Outdoor dining"],
      blurb: "Fine Levantine dining.",
      logo: "",
      image: "",
      image2: "",
      cuisine: "Lebanese",
    },
    {
      slug: "b",
      name: "Peking",
      address: "Sweifieh",
      city: "Amman",
      tags: ["Delivery"],
      blurb: "Chinese restaurant.",
      logo: "",
      image: "",
      image2: "",
      cuisine: "Chinese",
    },
    {
      slug: "c",
      name: "Aqaba Fish House",
      address: "South Beach",
      city: "Aqaba",
      tags: ["Parking"],
      blurb: "Seafood by the water.",
      logo: "",
      image: "",
      image2: "",
      cuisine: "Seafood",
    },
  ];

  it("returns everything for an empty query", () => {
    expect(filterEntries(sample, {})).toHaveLength(3);
  });

  it("filters by category, city and feature", () => {
    expect(filterEntries(sample, { category: "Chinese" }).map((r) => r.slug)).toEqual(["b"]);
    expect(filterEntries(sample, { city: "Aqaba" }).map((r) => r.slug)).toEqual(["c"]);
    expect(filterEntries(sample, { feature: "Parking" }).map((r) => r.slug)).toEqual(["a", "c"]);
  });

  it("combines filters conjunctively", () => {
    expect(filterEntries(sample, { city: "Amman", feature: "Parking" }).map((r) => r.slug)).toEqual([
      "a",
    ]);
  });

  it("searches name, cuisine, city, address and tags", () => {
    expect(filterEntries(sample, { q: "peking" }).map((r) => r.slug)).toEqual(["b"]);
    expect(filterEntries(sample, { q: "seafood" }).map((r) => r.slug)).toEqual(["c"]);
    expect(filterEntries(sample, { q: "sweifieh" }).map((r) => r.slug)).toEqual(["b"]);
    expect(filterEntries(sample, { q: "outdoor" }).map((r) => r.slug)).toEqual(["a"]);
  });

  it("is case-insensitive", () => {
    expect(filterEntries(sample, { q: "FAKHR" }).map((r) => r.slug)).toEqual(["a"]);
  });
});

describe("Arabic search folding", () => {
  const arabic: Restaurant[] = [
    {
      slug: "ar-1",
      name: "مطعم الأردن",
      address: "عمّان",
      city: "Amman",
      tags: [],
      blurb: "",
      logo: "",
      image: "",
      image2: "",
      cuisine: "Local / Jordanian Food",
    },
  ];

  it("matches alef variants — a search for الاردن must find الأردن", () => {
    // Arabic users routinely type without the hamza. Without folding this
    // search returns nothing, which reads as "the restaurant isn't listed".
    expect(filterEntries(arabic, { q: "الاردن" })).toHaveLength(1);
    expect(filterEntries(arabic, { q: "الأردن" })).toHaveLength(1);
  });

  it("ignores diacritics", () => {
    expect(filterEntries(arabic, { q: "عمان" })).toHaveLength(1);
  });
});

describe("suggest", () => {
  it("stays silent below two characters", () => {
    expect(suggest("a")).toHaveLength(0);
    expect(suggest("")).toHaveLength(0);
  });

  it("caps results so the panel stays scannable", () => {
    expect(suggest("a", 6).length).toBeLessThanOrEqual(6);
    expect(suggest("res", 3).length).toBeLessThanOrEqual(3);
  });

  it("carries filters as structured query, not as a href string", () => {
    // next-intl's router resolves a string href as a pathname only and drops
    // ?query, so a cuisine suggestion has to keep its filter separately.
    const cuisine = vocab.cuisines[0]!;
    const hit = suggest(cuisine, 20).find((s) => s.kind === "cuisine");
    expect(hit).toBeDefined();
    expect(hit!.href.pathname).toBe("/restaurants");
    expect(hit!.href.query).toEqual({ category: cuisine });
  });

  it("links entry suggestions straight to their detail page", () => {
    const first = restaurants[0]!;
    const hit = suggest(first.name, 20).find((s) => s.kind === "restaurant");
    expect(hit?.href.pathname).toMatch(/^\/restaurants\//);
  });

  it("surfaces the category shortcut, not only matching venues", () => {
    // Regression: the index lists every restaurant before the first cuisine,
    // and a restaurant's haystack contains its own cuisine/city/tags — so a
    // single capped pass returned six Italian restaurants and never "Italian"
    // the filter. Four of the six suggestion kinds were unreachable.
    const cuisine = vocab.cuisines[0]!;
    expect(suggest(cuisine, 6).some((s) => s.kind === "cuisine")).toBe(true);

    const city = vocab.cities[0]!;
    expect(suggest(city, 6).some((s) => s.kind === "governorate")).toBe(true);

    const feature = vocab.features[0]!;
    expect(suggest(feature, 6).some((s) => s.kind === "feature")).toBe(true);
  });

  it("still respects the cap once categories are included", () => {
    const cuisine = vocab.cuisines[0]!;
    expect(suggest(cuisine, 6).length).toBeLessThanOrEqual(6);
    expect(suggest(cuisine, 2).length).toBeLessThanOrEqual(2);
  });

  it("does not let categories crowd out a venue searched by name", () => {
    // At most half the panel is category suggestions, so searching a specific
    // venue still returns that venue.
    const named = suggest("Fakhr", 6);
    expect(named.some((s) => s.kind === "restaurant")).toBe(true);
  });
});

describe("entry helpers", () => {
  it("de-duplicates photos and drops empties", () => {
    const entry = { ...restaurants[0]!, logo: "x.jpg", image: "x.jpg", image2: "" };
    expect(photosOf(entry)).toEqual(["x.jpg"]);
  });

  it("builds a maps query from name and address", () => {
    const url = mapsUrl({ ...restaurants[0]!, name: "Test Venue", address: "Rainbow St" });
    expect(url).toContain("google.com/maps");
    expect(decodeURIComponent(url)).toContain("Test Venue, Rainbow St, Jordan");
  });
});
