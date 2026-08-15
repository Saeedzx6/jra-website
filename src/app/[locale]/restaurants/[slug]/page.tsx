import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin, Phone, Mail, Globe, Star, Clock, Leaf, ArrowRight, Building2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getRestaurantBySlug } from "@/lib/restaurants";
import { buildMetadata, toDescription } from "@/lib/seo";
import { jsonLdScript, restaurantLd, breadcrumbLd } from "@/lib/json-ld";

// Restaurant profiles are the site's primary search-traffic surface. Cached and
// revalidated hourly rather than rendered fresh per visit; admin edits can push
// a targeted revalidation when that lands.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant || restaurant.status !== "PUBLISHED") {
    return { title: "Not found", robots: { index: false, follow: false } };
  }

  const name = locale === "ar" && restaurant.nameAr ? restaurant.nameAr : restaurant.name;
  const place = restaurant.governorate?.nameEn;
  const cuisine = restaurant.cuisines[0]?.cuisine.nameEn;

  // Falls back through description → cuisine/place summary, so every one of the
  // 701 pages gets a distinct description rather than sharing the site default.
  const description =
    toDescription(restaurant.fullDescriptionHtml) ??
    restaurant.shortDescription ??
    [cuisine, place && `in ${place}`, "— classified by the Jordan Restaurant Association."]
      .filter(Boolean)
      .join(" ");

  return buildMetadata({
    locale,
    path: `/restaurants/${slug}`,
    title: place ? `${name} — ${place}` : name,
    description,
    image: restaurant.images.find((i) => i.isPrimary)?.url ?? restaurant.images[0]?.url ?? null,
  });
}

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
  const tn = await getTranslations("nav");
  const displayName = locale === "ar" && restaurant.nameAr ? restaurant.nameAr : restaurant.name;
  const cover = restaurant.images[0];

  // The sidebar CTA used to be href="#" on every restaurant page. Route it to
  // whichever channel the member actually publishes, in preference order, and
  // render nothing at all when there is none — a dead button is worse than no
  // button. (Phase 2 replaces this with logged inquiry routing, blueprint C4.)
  const digits = (value: string) => value.replace(/[^\d]/g, "");
  const primaryAction = restaurant.website
    ? { href: restaurant.website, label: t("visitWebsite"), external: true }
    : restaurant.whatsapp
      ? {
          href: `https://wa.me/${digits(restaurant.whatsapp)}`,
          label: t("messageOnWhatsapp"),
          external: true,
        }
      : restaurant.phone
        ? { href: `tel:${digits(restaurant.phone)}`, label: t("callRestaurant"), external: false }
        : null;

  const areaName =
    locale === "ar" && restaurant.area?.nameAr ? restaurant.area.nameAr : restaurant.area?.nameEn;
  const govName =
    locale === "ar" && restaurant.governorate?.nameAr
      ? restaurant.governorate.nameAr
      : restaurant.governorate?.nameEn;
  const place = [areaName, govName].filter(Boolean).join(" · ");

  const locationRows = [
    restaurant.addressText && {
      key: "address",
      Icon: MapPin,
      value: restaurant.addressText,
    },
    place && { key: "place", Icon: Building2, value: place },
    restaurant.openingHoursText && {
      key: "hours",
      Icon: Clock,
      value: restaurant.openingHoursText,
    },
  ].filter((r): r is { key: string; Icon: typeof MapPin; value: string } => Boolean(r));

  const contactRows = [
    restaurant.phone && {
      key: "phone",
      Icon: Phone,
      value: restaurant.phone,
      href: `tel:${digits(restaurant.phone)}`,
      // Phone numbers stay left-to-right even in the Arabic layout.
      ltr: true,
    },
    restaurant.whatsapp && {
      key: "whatsapp",
      Icon: Phone,
      value: restaurant.whatsapp,
      href: `https://wa.me/${digits(restaurant.whatsapp)}`,
      ltr: true,
    },
    restaurant.email && {
      key: "email",
      Icon: Mail,
      value: restaurant.email,
      href: `mailto:${restaurant.email}`,
      ltr: true,
    },
    restaurant.website && {
      key: "website",
      Icon: Globe,
      value: restaurant.website.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      href: restaurant.website,
      ltr: true,
    },
  ].filter(
    (r): r is { key: string; Icon: typeof Phone; value: string; href: string; ltr: boolean } =>
      Boolean(r)
  );

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(restaurantLd(restaurant, locale)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbLd(locale, [
              { name: tn("home"), path: "/" },
              { name: tn("restaurants"), path: "/restaurants" },
              { name: displayName, path: `/restaurants/${slug}` },
            ])
          ),
        }}
      />
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
          {/* Stars sit over the dark hero gradient, so the brand brass is the
              readable choice — the darkened -text variant is for light surfaces. */}
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
                    className="rounded-full bg-olive-soft px-3 py-1 text-sm text-olive-text"
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

        <aside className="h-fit rounded-2xl border border-rule bg-surface p-6">
          {/* Grouped by what the reader is actually looking for, and each group
              renders only when it has content. The directory holds an address
              for ~92% of listings and no contact channel at all for any of
              them, so a single "Contact" heading over one address line was the
              norm rather than the exception. */}
          {locationRows.length > 0 ? (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {tr("location")}
              </h2>
              <div className="mt-3 space-y-2.5">
                {locationRows.map(({ key, Icon, value }) => (
                  <div key={key} className="flex items-start gap-2.5 text-sm text-ink-soft">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {contactRows.length > 0 ? (
            <section className={locationRows.length > 0 ? "mt-6 border-t border-rule pt-6" : ""}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {tr("contact")}
              </h2>
              <div className="mt-3 space-y-2.5">
                {contactRows.map(({ key, Icon, value, href, ltr }) => (
                  <div key={key} className="flex items-start gap-2.5 text-sm text-ink-soft">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    {href ? (
                      <a
                        href={href}
                        className="truncate hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        {...(href.startsWith("http")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {value}
                      </a>
                    ) : (
                      <span {...(ltr ? { dir: "ltr" } : {})}>{value}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : (
            /* The honest empty state. It says what is missing and gives the one
               person who can fix it — the owner — a way to do so, which is also
               how the directory's missing contact data gets filled in. */
            <section className={locationRows.length > 0 ? "mt-6 border-t border-rule pt-6" : ""}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {tr("contact")}
              </h2>
              <p className="mt-3 text-sm font-medium text-ink">{tr("noContactTitle")}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{tr("noContactBody")}</p>
              <Link
                href="/membership"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {tr("claimListingCta")}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            </section>
          )}

          {restaurant.greenKeyCertified || restaurant.sustainabilityScore ? (
            <section className="mt-6 space-y-2 border-t border-rule pt-6">
              {restaurant.greenKeyCertified ? (
                <div className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-success-text">
                  <Leaf className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {tr("greenKeyCertified")}
                </div>
              ) : null}
              {restaurant.sustainabilityScore ? (
                <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <span className="text-ink-soft">{tr("sustainabilityScore")}</span>
                  <span className="tabular font-semibold text-success-text">
                    {Math.round(restaurant.sustainabilityScore)}/100
                  </span>
                </div>
              ) : null}
            </section>
          ) : null}

          {primaryAction ? (
            <a
              href={primaryAction.href}
              {...(primaryAction.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="mt-6 block rounded-full bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {primaryAction.label}
            </a>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
