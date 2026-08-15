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

export type Locale = (typeof routing.locales)[number];

/** Writing direction per locale. Drives <html dir> and every logical property. */
export const direction: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
};

export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}
