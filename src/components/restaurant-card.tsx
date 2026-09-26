import Image from "next/image";
import { useLocale } from "next-intl";
import { MapPin, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type RestaurantCardData = {
  slug: string;
  name: string;
  nameAr: string | null;
  shortDescription: string | null;
  imageUrl: string | null;
  governorateName: string | null;
  governorateNameAr?: string | null;
  cuisineName: string | null;
  cuisineNameAr?: string | null;
  stars: number | null;
  /** Signals below — the directory now holds real contact data for ~65%. */
  /** No longer rendered on the card — see the note where the row was
   *  removed. Kept on the type so `getFeaturedRestaurants` and the
   *  directory query need not change in the same commit. */
  hasPhone?: boolean;
  hasHours?: boolean;
};

const PLACEHOLDER_HUES = [
  "from-accent/25 to-accent/5",
  "from-olive/25 to-olive/5",
  "from-brass/30 to-brass/5",
];

function placeholderGradient(seed: string) {
  const idx = seed.charCodeAt(0) % PLACEHOLDER_HUES.length;
  return PLACEHOLDER_HUES[idx];
}

export function RestaurantCard({ restaurant }: { restaurant: RestaurantCardData }) {
  const locale = useLocale();
  const ar = locale === "ar";
  const displayName = (ar && restaurant.nameAr) || restaurant.name;

  const governorate = (ar && restaurant.governorateNameAr) || restaurant.governorateName;
  const cuisine = (ar && restaurant.cuisineNameAr) || restaurant.cuisineName;

  // Governorate and cuisine read as one line; whichever is missing simply
  // drops out rather than leaving an em dash standing in for nothing.
  const meta = [governorate, cuisine].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      className="motion-card group block overflow-hidden rounded-2xl border border-rule bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {/* 16:9 rather than a taller crop — a 4:3 image made the picture three
          quarters of the card, and at 16:9 three rows fit a laptop screen.
          Uploaded images are mostly business logos of wildly different
          shapes (square marks, wide wordmarks, circular badges), not
          uniform wide photos, so object-cover was cropping into them
          unpredictably. object-contain + padding shows each one whole,
          centered on a neutral fill, so the grid reads as one system
          instead of a set of random crops. */}
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-2 p-3">
        {restaurant.imageUrl ? (
          <Image
            src={restaurant.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
            className="motion-card-image object-contain"
          />
        ) : (
          <div
            className={`motion-card-image flex h-full w-full items-center justify-center bg-gradient-to-br ${placeholderGradient(
              restaurant.name
            )}`}
          >
            <span aria-hidden="true" className="font-display text-3xl text-ink/30">
              {displayName.trim().charAt(0)}
            </span>
          </div>
        )}
        {restaurant.stars ? (
          <div className="absolute end-2.5 top-2.5 flex items-center gap-1 rounded-full bg-ink/80 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
            <Star className="h-3 w-3 fill-brass text-brass" aria-hidden="true" />
            {restaurant.stars}
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <h3 className="truncate font-display font-semibold text-lg text-ink transition-colors group-hover:text-accent">
          {displayName}
        </h3>

        {meta ? (
          <p className="mt-1.5 flex items-center gap-1.5 truncate text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
            {meta}
          </p>
        ) : null}

      </div>
    </Link>
  );
}
