import { defineRouting } from "next-intl/routing";

/**
 * Arabic is a first-class locale, not an afterthought: the WRD requires
 * "Arabic and English in all core pages, forms and downloadable content
 * metadata". Both locales are always prefixed so neither reads as the default.
 */
export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

/**
 * `Locale` is the name the ported front end uses for the same type. Both are
 * exported so neither half of the codebase has to be rewritten to match the
 * other's vocabulary.
 */
export type Locale = AppLocale;

/** Writing direction per locale. Drives <html dir> and every logical property. */
export const direction: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
};

export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}
