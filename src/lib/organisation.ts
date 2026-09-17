/**
 * JRA's own details, in one place.
 *
 * These were previously retyped in each file that needed them: the telephone
 * number in four, the address in two, the social links in two. That is how a
 * site ends up advertising a number in its structured data that no longer
 * matches the one in its footer -- and `organizationLd` below is built on the
 * premise that the two agree, because search engines treat a mismatch between
 * structured data and the visible page as a signal against the site.
 *
 * The telephone appears in three shapes because three consumers need three:
 * `tel:` links take no punctuation, schema.org asks for the dialling form, and
 * a reader wants it grouped. They are written out rather than derived so that
 * changing the number means changing one object, not trusting a formatter.
 *
 * This file holds facts, not markup: no React, no next-intl, so the sitemap
 * and the JSON-LD builders can import it as freely as a component can.
 */
export const ORG = {
  name: {
    en: "Jordan Restaurant Association",
    ar: "نقابة أصحاب المطاعم الأردنية",
  },
  /** A number, because the About page counts the years since it. */
  foundingYear: 2002,

  phone: {
    /** For `tel:` hrefs -- digits and a leading plus only. */
    href: "tel:+96264621558",
    /** For schema.org `telephone`. */
    schema: "+962-6-462-1558",
    /** For reading on screen. Render inside `dir="ltr"`. */
    display: "+962 6 462 1558",
  },

  email: "info@jra.jo",
  get emailHref() {
    return `mailto:${this.email}`;
  },

  address: {
    country: "JO",
    locality: "Amman",
    street: {
      en: "Jabal Amman, 2nd Circle, Salman Al-Madabi St, Building 12",
      ar: "جبل عمان، الدوار الثاني، شارع سلمان المادبي، عمارة رقم 12",
    },
  },

  /** The query the embedded map is centred on. */
  mapQuery: "Jordan Restaurant Association, Jabal Amman, Amman, Jordan",

  /**
   * Ordered as they are shown in the footer. `key` names the icon the footer
   * pairs with each one; the URLs are also emitted as schema.org `sameAs`,
   * which is how a search engine confirms these profiles are the same body.
   */
  social: [
    { key: "facebook", label: "Facebook", url: "https://www.facebook.com/JoRestaurants" },
    { key: "instagram", label: "Instagram", url: "https://www.instagram.com/jorestaurantassociation/" },
    { key: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/jordan-restaurant-association-jra/" },
    { key: "youtube", label: "YouTube", url: "https://www.youtube.com/user/JoRestaurants" },
  ],

  /** Site-relative; prefix with the origin where an absolute URL is required. */
  brand: {
    logo: "/brand/jra-logo.png",
    ogImage: "/brand/og-default.png",
  },
} as const;

/** The organisation's name in the reader's language. */
export function orgName(locale: string) {
  return locale === "ar" ? ORG.name.ar : ORG.name.en;
}

/** The street address in the reader's language. */
export function orgStreet(locale: string) {
  return locale === "ar" ? ORG.address.street.ar : ORG.address.street.en;
}
