/**
 * The class strings this interface repeats.
 *
 * These were copy-pasted rather than shared: the section heading appeared in
 * 27 files, the panel in 16, the text field in 7 under two different local
 * `FIELD` constants. Restyling any of them meant finding every copy, and the
 * copies had already drifted -- 23 fields carried no focus style at all while
 * 26 removed the browser's outline and replaced it with a border tint, which
 * is a weaker focus indicator than the one it replaced.
 *
 * Widths are deliberately not baked in. The old `FIELD` began with `w-full`,
 * so `${FIELD} w-28` put `w-full` and `w-28` on the same element and left the
 * winner to the order Tailwind happened to emit the two rules in, not to the
 * order they were written. Callers state the width they want.
 */

/** Joins class names, dropping anything falsy. */
export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Shared by every field shape. The focus ring is `focus-visible`, so it shows
 * for a keyboard user and not for a mouse click, and it is an outline rather
 * than only a border colour: a border tint alone was the entire focus
 * indicator on 26 of these, which is not enough to see.
 */
const FIELD_FOCUS =
  "border border-rule text-sm transition-colors focus-visible:border-accent " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-accent";

/** Three shapes are actually in use: two sizes of box, and a pill for search. */
const BOX = `rounded-lg px-4 py-2.5 ${FIELD_FOCUS}`;
const BOX_COMPACT = `rounded-lg px-3 py-2 ${FIELD_FOCUS}`;
const PILL = `rounded-full px-4 py-2 ${FIELD_FOCUS}`;

export const ui = {
  /** The `h1` of a public page. */
  pageTitle: "font-display font-semibold text-5xl text-ink",

  /** The `h1` of an admin screen, and section headings within a page. */
  sectionTitle: "font-display text-2xl font-semibold text-ink",

  /** The bordered block that groups one set of controls. */
  panel: "rounded-2xl border border-rule bg-surface p-5",

  /** The label above a field. */
  fieldLabel: "mb-1 block text-sm font-medium text-ink-soft",

  /**
   * Text fields. The `OnPaper` variants are for a field sitting directly on
   * the page background rather than inside a `panel`; they swap the fill so
   * the control still reads as inset either way.
   */
  field: `${BOX} bg-paper`,
  fieldOnPaper: `${BOX} bg-surface`,

  fieldCompact: `${BOX_COMPACT} bg-paper`,
  fieldCompactOnPaper: `${BOX_COMPACT} bg-surface`,

  fieldPill: `${PILL} bg-paper`,
  fieldPillOnPaper: `${PILL} bg-surface`,
} as const;
