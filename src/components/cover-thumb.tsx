import Image from "next/image";

/**
 * Cover image for a content card, with a designed empty state.
 *
 * Every content type on the site has had a cover-image column for a long time
 * and almost none of them are filled — 64 published news articles, zero
 * covers. So the empty case is the common case today, and it has to look
 * deliberate rather than broken.
 *
 * The placeholder derives a hue from the record's own slug, so a card looks
 * the same on every visit and two cards next to each other rarely match. It
 * carries the first letter of the title, which makes a grid of empty cards
 * scannable instead of uniform.
 *
 * `sizes` is passed by the caller because only the caller knows the grid.
 */
const PLACEHOLDER_TINTS = [
  "from-accent-soft to-surface-2",
  "from-brass-soft to-surface-2",
  "from-olive-soft to-surface-2",
  "from-surface-2 to-accent-soft",
] as const;

function tintFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PLACEHOLDER_TINTS[hash % PLACEHOLDER_TINTS.length];
}

export function CoverThumb({
  url,
  alt,
  seed,
  title,
  sizes,
  aspect = "aspect-[16/9]",
  priority = false,
}: {
  url: string | null | undefined;
  /** Empty string marks the image as decorative — use when the title is adjacent. */
  alt: string;
  /** Stable per-record value (a slug or id) used to pick the placeholder tint. */
  seed: string;
  /** Supplies the placeholder's initial. */
  title: string;
  sizes: string;
  aspect?: string;
  priority?: boolean;
}) {
  return (
    <div className={`zoom-frame relative ${aspect} overflow-hidden bg-surface-2`}>
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="motion-card-image object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className={`motion-card-image flex h-full w-full items-center justify-center bg-gradient-to-br ${tintFor(seed)}`}
        >
          <span className="font-display text-4xl text-ink/20">
            {title.trim().charAt(0) || "·"}
          </span>
        </div>
      )}
    </div>
  );
}
