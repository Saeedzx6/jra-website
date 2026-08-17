import { Poppins, DM_Sans, Cairo } from "next/font/google";

// Direction B's type voice (design-system/MASTER.md §2). The previous pairing
// here was Manrope/Fraunces/IBM Plex; it was replaced wholesale rather than
// blended, because a display voice is a single choice and half of one reads
// as an accident.
//
// The token NAMES (--font-display-en, --font-body-en, …) are kept so the
// @theme mapping in globals.css and the 98 `.font-display` call sites in the
// markup keep working untouched.

// Latin display. Direction B's signature is italic 700 Poppins, so the italic
// axis is loaded deliberately rather than left to the browser to synthesise —
// a faux-oblique Poppins loses the corrected letterforms that make the voice.
export const displayEn = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display-en",
  display: "swap",
});

// Direction B has no separate editorial serif — the italic display IS the
// editorial voice. The token is kept (one call site, and the @theme mapping
// references it) but points at the same family, so `.font-editorial` and
// `.font-display` differ only in the styling applied in globals.css.
export const editorialEn = displayEn;

// Body copy.
export const bodyEn = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body-en",
  display: "swap",
});

// Arabic, used for BOTH display and body in the ar locale. One face rather
// than a mismatched pair: Cairo carries the display weight at 700 and reads
// cleanly at body sizes, and Direction B's Latin display cannot be mapped
// onto Arabic anyway (see the italic note in globals.css).
export const arabic = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body-ar",
  display: "swap",
});

// The theme also references --font-display-ar and --font-editorial-en. Both
// are aliased to the families above in globals.css rather than loaded twice:
// a second loader call for the same family would ship a duplicate font file.
export const displayAr = arabic;
export const bodyAr = arabic;

// Emitted on <html>. Each family is listed once — Next generates one class per
// loader call, and `arabic`/`displayEn` are shared by two exports each.
export const fontVariables = [
  displayEn.variable,
  bodyEn.variable,
  arabic.variable,
]
  .join(" ")
  .trim();
