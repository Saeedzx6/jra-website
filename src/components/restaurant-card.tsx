import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, Star, Phone, Clock } from "lucide-react";
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
  const t = useTranslations("restaurants");
  const displayName = locale === "ar" && restaurant.nameAr ? restaurant.nameAr : restaurant.name;

  const ar = locale === "ar";
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
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        {restaurant.imageUrl ? (
          <Image
            src={restaurant.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
            className="motion-card-image object-cover"
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
        <h3 className="truncate font-display text-base font-semibold text-ink transition-colors group-hover:text-accent">
          {displayName}
        </h3>

        {meta ? (
          <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
            {meta}
          </p>
        ) : null}

        {/* What a reader actually wants to know before clicking: can I ring
            them, and do I know when they open. The card used to close with
            "Learn more →" — the same four words on all 701 of them, on an
            element that is already entirely a link. */}
        {restaurant.hasPhone || restaurant.hasHours ? (
          <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-faint">
            {restaurant.hasPhone ? (
              <li className="inline-flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
                {t("hasPhone")}
              </li>
            ) : null}
            {restaurant.hasHours ? (
              <li className="inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                {t("hasHours")}
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </Link>
  );
}
