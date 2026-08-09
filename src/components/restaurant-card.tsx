import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type RestaurantCardData = {
  slug: string;
  name: string;
  nameAr: string | null;
  shortDescription: string | null;
  imageUrl: string | null;
  governorateName: string | null;
  cuisineName: string | null;
  stars: number | null;
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
  const t = useTranslations("common");
  const displayName = locale === "ar" && restaurant.nameAr ? restaurant.nameAr : restaurant.name;

  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      className="motion-card group block overflow-hidden rounded-2xl border border-rule bg-surface"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        {restaurant.imageUrl ? (
          <Image
            src={restaurant.imageUrl}
            alt={displayName}
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
            <span className="font-display text-3xl text-ink/30">
              {displayName.trim().charAt(0)}
            </span>
          </div>
        )}
        {restaurant.stars ? (
          <div className="absolute end-2.5 top-2.5 flex items-center gap-1 rounded-full bg-ink/80 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
            <Star className="h-3 w-3 fill-brass text-brass" />
            {restaurant.stars}
          </div>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="truncate font-display text-base font-semibold text-ink">
          {displayName}
        </h3>
        <p className="mt-1 flex items-center gap-1 truncate text-sm text-ink-soft">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
          {restaurant.governorateName ?? "—"}
          {restaurant.cuisineName ? ` · ${restaurant.cuisineName}` : ""}
        </p>
        <span className="mt-3 inline-block text-sm font-medium text-accent">
          {t("learnMore")} →
        </span>
      </div>
    </Link>
  );
}
