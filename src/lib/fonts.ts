import { Poppins, DM_Sans, Cairo } from "next/font/google";

// ---------------------------------------------------------------------------
// Typefaces per design-system/MASTER.md §2.
//
// The variable names below are the ones the rest of the app already consumes
// (--font-display-en, --font-body-en, …), so this file repoints the faces
// without any component needing to know. The previous pairing was
// Fraunces + Manrope + IBM Plex Sans Arabic.
// ---------------------------------------------------------------------------

// Latin display. Italic 700 Poppins is the signature of the chosen direction
// and the most distinctive thing about it — the italic is applied through
// --display-style in globals.css, never hardcoded, so the Arabic build can
// neutralise it.
export const displayEn = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display-en",
  display: "swap",
});

// Latin body.
export const bodyEn = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body-en",
  display: "swap",
});

// Arabic, display and body both. Cairo carries the display weight upright at
// 700 rather than borrowing the Latin italic, which Arabic has no tradition
// for and which reads as a rendering fault.
export const displayAr = Cairo({
  subsets: ["arabic"],
  weight: ["700"],
  variable: "--font-display-ar",
  display: "swap",
});

export const bodyAr = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-body-ar",
  display: "swap",
});

// NOTE: there is no editorial serif any more. MASTER.md defines two Latin
// roles, display and body, and a third voice was the kind of drift the spec
// exists to prevent. `.font-editorial` in globals.css now resolves to the
// display face, so the one call site that used it keeps working.

export const fontVariables = `${displayEn.variable} ${displayAr.variable} ${bodyEn.variable} ${bodyAr.variable}`;
