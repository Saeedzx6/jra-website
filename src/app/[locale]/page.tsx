import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Store,
  ClipboardCheck,
  Leaf,
  Handshake,
  ArrowRight,
  Info,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { RestaurantCard } from "@/components/restaurant-card";
import { RevealGroup } from "@/components/reveal";
import { NewsletterForm } from "@/components/newsletter-form";
import { CountUp } from "@/components/count-up";
import { HomeHero } from "@/components/home/hero";
import { getFeaturedRestaurants } from "@/lib/restaurants";
import { db } from "@/lib/db";

// Cached and revalidated every 300s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 300;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");
  const tNav = await getTranslations("nav");

  const [
    featured,
    restaurantCount,
    supplierCount,
    representedGovernorates,
    latestNews,
    heroImageRows,
    cuisineRows,
  ] = await Promise.all([
    getFeaturedRestaurants(6),
    db.restaurant.count({ where: { status: "PUBLISHED" } }),
    db.supplier.count({ where: { status: "PUBLISHED" } }),
    db.restaurant.findMany({
      where: { status: "PUBLISHED", governorateId: { not: null } },
      distinct: ["governorateId"],
      select: { governorateId: true },
    }),
    db.newsArticle.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      include: { translations: { where: { locale: locale === "ar" ? "ar" : "en" } } },
    }),
    // Hero corridor: real member photography rather than stock. One image per
    // restaurant so the same venue never appears twice on a rail. Fourteen
    // covers the seven cards per rail without the sequence visibly repeating.
    db.restaurantImage.findMany({
      where: { isPrimary: true, restaurant: { status: "PUBLISHED" } },
      select: { url: true, altTextEn: true, altTextAr: true, restaurant: { select: { name: true } } },
      distinct: ["restaurantId"],
      take: 14,
      orderBy: { restaurantId: "asc" },
    }),
    db.cuisine.findMany({
      select: {
        slug: true,
        nameEn: true,
        nameAr: true,
        _count: { select: { restaurants: true } },
      },
    }),
  ]);

  const totalMembers = restaurantCount + supplierCount;
  const governorateCount = representedGovernorates.length;

  const heroImages = heroImageRows.map((img) => ({
    url: img.url,
    alt: (locale === "ar" ? img.altTextAr : img.altTextEn) ?? img.restaurant?.name ?? "",
  }));

  // Top cuisines by member count. Empty ones are dropped rather than shown as
  // zeroes — the strip is meant to read as range, not as a gap report.
  const heroCuisines = cuisineRows
    .filter((c) => c._count.restaurants > 0)
    .sort((a, b) => b._count.restaurants - a._count.restaurants)
    .slice(0, 8)
    .map((c) => ({
      slug: c.slug,
      label: (locale === "ar" && c.nameAr ? c.nameAr : c.nameEn) ?? c.slug,
      count: c._count.restaurants,
    }));

  const services = [
    {
      icon: Store,
      title: t("serviceDirectory"),
      desc: t("serviceDirectoryDesc"),
      href: "/restaurants",
    },
    {
      icon: ClipboardCheck,
      title: t("serviceClassification"),
      desc: t("serviceClassificationDesc"),
      href: "/classification",
    },
    {
      icon: Handshake,
      title: t("serviceMembership"),
      desc: t("serviceMembershipDesc"),
      href: "/membership",
    },
    {
      icon: Leaf,
      title: t("serviceSustainability"),
      desc: t("serviceSustainabilityDesc"),
      href: "/sustainability",
    },
  ];

  return (
    /* The descent runs the whole page. It is deliberately two gradients, not
       one: the murky middle of a navy-to-white ramp is where text becomes
       unreadable, so that part is compressed into the inner container below,
       where the styling is under control. Everything out here stays light —
       #eef1f5 drifting to paper across the remaining sections — which is a
       change you feel while scrolling rather than one you can point at. */
    <div className="bg-gradient-to-b from-[#d5dfec] to-white">
      {/* The navy-to-paper fade spans exactly this container: the hero and
          the services grid. Anchoring it to a real element rather than
          guessing viewport heights is what keeps it predictable — the fade
          finishes at a known edge, so nothing further down can drift onto a
          mid-tone where neither dark nor light text is readable. Everything
          inside is styled for a dark ground; everything after is on paper. */}
      <div className="bg-[linear-gradient(180deg,#173156_0%,#173156_58%,#16304d_78%,#d5dfec_100%)]">
      <HomeHero
        images={heroImages}
        cuisines={heroCuisines}
        restaurantCount={restaurantCount}
      />

      {/* Sector services — inside the dark half of the fade, so the heading
          is light and the cards keep their own solid surface rather than
          going translucent, which would drag their text onto the navy. */}
      <section className="mx-auto max-w-6xl px-4 pb-28 pt-16 sm:px-6 sm:pb-36">
        <h2 className="font-display text-2xl font-semibold text-white">
          {t("servicesTitle")}
        </h2>
        <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="motion-card reveal group rounded-2xl border border-rule bg-surface p-6"
            >
              <s.icon className="h-6 w-6 text-accent" strokeWidth={1.75} />
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                {tCommon("learnMore")}
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </span>
            </Link>
          ))}
        </RevealGroup>
      </section>
      </div>

      {/* Stats */}
      <section className="border-y border-rule">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 text-center sm:grid-cols-4 sm:px-6">
          <div>
            <div className="font-display text-4xl font-semibold text-accent">
              <CountUp value={totalMembers} suffix="+" />
            </div>
            <div className="mt-1 text-sm text-ink-soft">{t("statMembers")}</div>
          </div>
          <div>
            <div className="font-display text-4xl font-semibold text-accent">
              <CountUp value={restaurantCount} />
            </div>
            <div className="mt-1 text-sm text-ink-soft">Restaurants listed</div>
          </div>
          <div>
            <div className="font-display text-4xl font-semibold text-accent">
              <CountUp value={governorateCount} />
            </div>
            <div className="mt-1 text-sm text-ink-soft">{t("statGovernorates")}</div>
          </div>
          <div>
            <div className="font-display text-4xl font-semibold text-accent">2002</div>
            <div className="mt-1 text-sm text-ink-soft">{t("statFounded")}</div>
          </div>
        </div>
      </section>

      {/* Featured restaurants */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink">
              {t("serviceDirectory")}
            </h2>
            <Link href="/restaurants" className="text-sm font-medium text-accent">
              {tCommon("viewAll")} →
            </Link>
          </div>
          <RevealGroup className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((r) => (
              <div key={r.slug} className="reveal">
                <RestaurantCard restaurant={r} />
              </div>
            ))}
          </RevealGroup>
        </section>
      )}

      {/* News */}
      {latestNews.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink">
              {t("newsTitle")}
            </h2>
            <Link href="/news" className="text-sm font-medium text-accent">
              {tCommon("viewAll")} →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {latestNews.map((n) => (
              <Link
                key={n.id}
                href={`/news/${n.slug}`}
                className="motion-card block rounded-2xl border border-rule bg-surface p-5"
              >
                {n.publishedAt ? (
                  <time className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                    {new Date(n.publishedAt).toLocaleDateString(locale)}
                  </time>
                ) : null}
                <h3 className="mt-2 font-display text-base font-semibold leading-snug text-ink">
                  {n.translations[0]?.title ?? "—"}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="border-t border-rule text-ink">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-2xl font-semibold">{t("newsletterTitle")}</h2>
          <p className="mt-2 text-ink-soft">{t("newsletterSubtitle")}</p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
