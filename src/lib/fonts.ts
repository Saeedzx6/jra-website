import { Manrope, Fraunces, IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";

// Editorial display serif for the marketing surfaces (hero, section leads).
// Fraunces rather than the reflexive Playfair pick: its softer, slightly
// wonky letterforms read warm instead of austere, which suits a hospitality
// body more than a fashion masthead. Latin only — Arabic keeps its own face.
export const editorialEn = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-editorial-en",
  display: "swap",
});

// English display — modern geometric sans, confident at weight, distinct
// letterforms (single-storey 'a', open apertures) without leaning on the
// over-used "safe" AI defaults.
export const displayEn = Manrope({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display-en",
  display: "swap",
});

// Arabic display — the same family used for Arabic body, at a heavier
// weight, rather than forcing a mismatched second Arabic face.
export const displayAr = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["600", "700"],
  variable: "--font-display-ar",
  display: "swap",
});

// Body copy — a genuine matched multi-script pair (designed together, not
// a Latin font with an Arabic face bolted on), which matters for a site
// that is Arabic-primary in real use.
export const bodyEn = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body-en",
  display: "swap",
});

export const bodyAr = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-body-ar",
  display: "swap",
});

export const fontVariables = `${displayEn.variable} ${editorialEn.variable} ${displayAr.variable} ${bodyEn.variable} ${bodyAr.variable}`;
