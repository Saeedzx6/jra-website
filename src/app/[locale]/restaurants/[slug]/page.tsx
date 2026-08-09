import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin, Phone, Mail, Globe, Star, Clock } from "lucide-react";
import { getRestaurantBySlug } from "@/lib/restaurants";

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant || restaurant.status === "ARCHIVED") notFound();

  const t = await getTranslations("common");
  const tr = await getTranslations("restaurants");
  const displayName = locale === "ar" && restaurant.nameAr ? restaurant.nameAr : restaurant.name;
  const cover = restaurant.images[0];

  return (
    <div>
      <div className="relative h-64 w-full overflow-hidden bg-surface-2 sm:h-80">
        {cover ? (
          <Image src={cover.url} alt={displayName} fill priority className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-6xl text-ink/20">
              {displayName.trim().charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-6 sm:px-6">
          <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            {displayName}
          </h1>
          {restaurant.classificationLevel ? (
            <div className="mt-2 flex items-center gap-1 text-brass">
              {Array.from({ length: restaurant.classificationLevel.stars }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-brass" />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {restaurant.fullDescriptionHtml ? (
            <div
              className="prose max-w-none text-ink-soft [&_a]:text-accent [&_p]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: restaurant.fullDescriptionHtml }}
            />
          ) : restaurant.shortDescription ? (
            <p className="leading-relaxed text-ink-soft">{restaurant.shortDescription}</p>
          ) : null}

          {restaurant.cuisines.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg font-semibold text-ink">{tr("cuisine")}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {restaurant.cuisines.map((c) => (
                  <span
                    key={c.cuisineId}
                    className="rounded-full bg-olive-soft px-3 py-1 text-sm text-olive"
                  >
                    {locale === "ar" && c.cuisine.nameAr ? c.cuisine.nameAr : c.cuisine.nameEn}
                  </span>
                ))}
              </div>
            </div>
          )}

          {restaurant.amenityTags.length > 0 && (
            <div className="mt-6">
              <h2 className="font-display text-lg font-semibold text-ink">{tr("features")}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {restaurant.amenityTags.map((a) => (
                  <span
                    key={a.amenityTagId}
                    className="rounded-full border border-rule px-3 py-1 text-sm text-ink-soft"
                  >
                    {locale === "ar" && a.amenityTag.nameAr
                      ? a.amenityTag.nameAr
                      : a.amenityTag.nameEn}
                  </span>
                ))}
              </div>
            </div>
          )}

          {restaurant.images.length > 1 && (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {restaurant.images.slice(1).map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl">
                  <Image src={img.url} alt={displayName} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4 rounded-2xl border border-rule bg-surface p-6 h-fit">
          <h2 className="font-display text-lg font-semibold text-ink">{tr("contact")}</h2>
          {restaurant.addressText ? (
            <div className="flex items-start gap-2 text-sm text-ink-soft">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{restaurant.addressText}</span>
            </div>
          ) : null}
          {restaurant.phone ? (
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <Phone className="h-4 w-4 shrink-0 text-accent" />
              <span dir="ltr">{restaurant.phone}</span>
            </div>
          ) : null}
          {restaurant.email ? (
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <Mail className="h-4 w-4 shrink-0 text-accent" />
              <span>{restaurant.email}</span>
            </div>
          ) : null}
          {restaurant.website ? (
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <Globe className="h-4 w-4 shrink-0 text-accent" />
              <a href={restaurant.website} className="truncate hover:text-accent">
                {restaurant.website}
              </a>
            </div>
          ) : null}
          {restaurant.openingHoursText ? (
            <div className="flex items-start gap-2 text-sm text-ink-soft">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{restaurant.openingHoursText}</span>
            </div>
          ) : null}
          {restaurant.greenKeyCertified && (
            <div className="rounded-lg bg-olive-soft px-3 py-2 text-sm font-medium text-olive">
              {tr("greenKeyCertified")}
            </div>
          )}
          {restaurant.sustainabilityScore ? (
            <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
              <span className="text-ink-soft">{tr("sustainabilityScore")}</span>
              <span className="tabular font-semibold text-olive">
                {Math.round(restaurant.sustainabilityScore)}/100
              </span>
            </div>
          ) : null}
          <a
            href="#"
            className="mt-2 block rounded-full bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            {t("learnMore")}
          </a>
        </aside>
      </div>
    </div>
  );
}
