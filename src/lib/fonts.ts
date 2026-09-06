import {
  Instrument_Serif,
  IBM_Plex_Mono,
  IBM_Plex_Sans_Arabic,
  Amiri,
} from "next/font/google";

/**
 * Typography follows the Monad reference: an editorial serif for every
 * heading, a monospace UI face for everything else.
 *
 * The Arabic problem, and how it is solved
 * ---------------------------------------
 * There is no usable Arabic monospace. Rather than drop the mono voice for
 * `/ar` — which would leave the two locales looking like different sites —
 * each role has a locale-appropriate face and the swap happens in CSS on
 * `[dir="rtl"]`. Latin gets the mono; Arabic gets a Naskh sans tuned for the
 * same density. The *role* is preserved even though the classification of the
 * typeface is not.
 *
 * Weight
 * ------
 * Instrument Serif ships one weight, 400. That is deliberate: Monad's rule is
 * that headings are never 600 or 700, and letting the font enforce it means a
 * stray `font-semibold` in a component cannot quietly break the system. The
 * stroke contrast and negative tracking carry the hierarchy instead.
 *
 * Amiri is the Arabic display counterpart — a Naskh with comparable contrast,
 * so Arabic headings read as the same design rather than a fallback.
 */

/** Headings, Latin. One weight by design — see above. */
export const displayEn = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display-en",
  display: "swap",
});

/** Headings, Arabic. */
export const displayAr = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-display-ar",
  display: "swap",
});

/** Body, nav, buttons, badges, tags, form labels — Latin. */
export const bodyEn = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body-en",
  display: "swap",
});

/** The same role in Arabic. No Arabic monospace exists that is fit for body copy. */
export const bodyAr = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body-ar",
  display: "swap",
});

/**
 * `.font-editorial` predates this system and is still referenced by the hero.
 * It now resolves to the same serif as every other heading — the distinction it
 * used to draw (Fraunces/Playfair for leads, a sans for section headings) is
 * exactly what Monad collapses.
 */
export const editorialEn = displayEn;

export const fontVariables = `${displayEn.variable} ${displayAr.variable} ${bodyEn.variable} ${bodyAr.variable}`;
