import "dotenv/config";
import path from "node:path";
import slugifyLib from "slugify";

export const LEGACY_DIR = process.env.JRA_LEGACY_DATA_DIR ?? "";
export const ASSETS_DIR = process.env.JRA_ASSETS_DATA_DIR ?? "";

export function legacyPath(...segments: string[]) {
  return path.join(LEGACY_DIR, ...segments);
}

export function assetsPath(...segments: string[]) {
  return path.join(ASSETS_DIR, ...segments);
}

export function slugify(input: string) {
  return slugifyLib(input, { lower: true, strict: true, trim: true });
}

/** Appends -2, -3, ... to keep slugs unique within a single seed run. */
export function makeUniqueSlugger() {
  const seen = new Map<string, number>();
  return (input: string) => {
    const base = slugify(input) || "item";
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };
}

export function splitSemicolonList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean);
}

const GOVERNORATE_KEYWORDS: { slug: string; nameEn: string; nameAr: string; keywords: string[] }[] = [
  { slug: "amman", nameEn: "Amman", nameAr: "عمان", keywords: ["amman"] },
  { slug: "irbid", nameEn: "Irbid", nameAr: "إربد", keywords: ["irbid"] },
  { slug: "zarqa", nameEn: "Zarqa", nameAr: "الزرقاء", keywords: ["zarqa"] },
  { slug: "balqa", nameEn: "Balqa", nameAr: "البلقاء", keywords: ["balqa", "salt"] },
  { slug: "madaba", nameEn: "Madaba", nameAr: "مادبا", keywords: ["madaba"] },
  { slug: "karak", nameEn: "Karak", nameAr: "الكرك", keywords: ["karak"] },
  { slug: "tafilah", nameEn: "Tafilah", nameAr: "الطفيلة", keywords: ["tafilah", "tafila"] },
  { slug: "maan", nameEn: "Ma'an", nameAr: "معان", keywords: ["ma'an", "maan"] },
  { slug: "aqaba", nameEn: "Aqaba", nameAr: "العقبة", keywords: ["aqaba"] },
  { slug: "jerash", nameEn: "Jerash", nameAr: "جرش", keywords: ["jerash"] },
  { slug: "ajloun", nameEn: "Ajloun", nameAr: "عجلون", keywords: ["ajloun"] },
  { slug: "mafraq", nameEn: "Mafraq", nameAr: "المفرق", keywords: ["mafraq"] },
];

export const GOVERNORATES = GOVERNORATE_KEYWORDS;

export function guessGovernorateSlug(text: string): string | null {
  const lower = text.toLowerCase();
  for (const g of GOVERNORATE_KEYWORDS) {
    if (g.keywords.some((k) => lower.includes(k))) return g.slug;
  }
  return null;
}
