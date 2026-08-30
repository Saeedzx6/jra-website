import { Playfair_Display, Plus_Jakarta_Sans, Cairo, Noto_Sans_Arabic } from "next/font/google";

/**
 * Editorial Display (English) — High-contrast serif for luxury, heritage, and key section leads.
 * Playfair Display gives a polished, high-end culinary & hospitality editorial feel.
 */
export const editorialEn = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-editorial-en",
  display: "swap",
});

/**
 * Modern Display Sans (English) — Crisp geometric sans with modern aperture.
 * Plus Jakarta Sans offers exceptional legibility for UI headings, tags, and dashboard elements.
 */
export const displayEn = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display-en",
  display: "swap",
});

/**
 * Arabic Display — Modern Kufic/Geometric typography tailored for high-impact headlines.
 * Cairo brings modern elegance to Arabic headings without feeling dated or heavy.
 */
export const displayAr = Cairo({
  subsets: ["arabic"],
  weight: ["600", "700", "800"],
  variable: "--font-display-ar",
  display: "swap",
});

/**
 * English Body Text — Neutral, clean, highly readable workhorse font.
 * Reuses Plus Jakarta Sans for visual unity across English UI body copy.
 */
export const bodyEn = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body-en",
  display: "swap",
});

/**
 * Arabic Body Text — Highly legible Naskh-inspired modern typeface.
 * Noto Sans Arabic ensures comfortable long-form reading for Arabic content across all device sizes.
 */
export const bodyAr = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-body-ar",
  display: "swap",
});

export const fontVariables = `${displayEn.variable} ${editorialEn.variable} ${displayAr.variable} ${bodyEn.variable} ${bodyAr.variable}`;