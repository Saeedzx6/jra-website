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
import { ParallaxBackdrop } from "@/components/parallax-backdrop";
import { NewsletterForm } from "@/components/newsletter-form";
import { CountUp } from "@/components/count-up";
import { getFeaturedRestaurants } from "@/lib/restaurants";
import { getSiteSettings } from "@/lib/actions/settings";
import { db } from "@/lib/db";

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

  const [featured, restaurantCount, supplierCount, representedGovernorates, latestNews, siteSettings] =
    await Promise.all([
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
      getSiteSettings(),
    ]);

  const heroImageUrl = siteSettings?.heroImageUrl ?? "/brand/jra-mark.png";
  const heroImageIsCustom = Boolean(siteSettings?.heroImageUrl);

  const totalMembers = restaurantCount + supplierCount;
  const governorateCount = representedGovernorates.length;

  // The hero photo pair speaks for the association itself, not for individual
  // member venues — admins can swap either slot from Admin → Settings, and
  // each falls back to a bundled JRA photograph.
  const heroShowcase = [
    {
      src: siteSettings?.showcaseOneUrl ?? "/brand/jra-showcase-kitchen.png",
      alt: t("showcaseAltOne"),
    },
    {
      src: siteSettings?.showcaseTwoUrl ?? "/brand/jra-showcase-board.png",
      alt: t("showcaseAltTwo"),
    },
  ];

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
    <div>
      {/* Hero — editorial: a white card floating over a scenic parallax layer,
          with the featured photography breaking the card's lower edge. */}
      <section className="relative overflow-hidden pb-28 sm:pb-40">
        {/* No negative z-index here: nothing between this and <body> creates a
            stacking context, so -z-10 would drop the layer behind the opaque
            body background and hide it entirely. DOM order alone keeps the
            hero card painting on top. */}
        <div className="absolute inset-0">
          <ParallaxBackdrop speed={0.18} className="absolute inset-x-0 -top-24 h-[130%]">
            <Image
              src={heroImageUrl}
              alt=""
              fill
              priority
              className={
                heroImageIsCustom
                  ? "object-cover"
                  : "animate-drift object-contain p-16 opacity-[0.07] sm:p-24"
              }
            />
          </ParallaxBackdrop>
          {/* Scrim only has to blend the backdrop into the page below — the hero
              text sits on the white card, not on this layer. An uploaded photo
              therefore gets a light wash so it stays visible; the default JRA
              mark keeps the heavier treatment since it is a flat logo. */}
          <div
            className={
              heroImageIsCustom
                ? "absolute inset-0 bg-gradient-to-b from-paper/10 via-paper/35 to-paper"
                : "absolute inset-0 bg-gradient-to-b from-paper/70 via-paper/85 to-paper backdrop-blur-[2px]"
            }
          />
        </div>

        <div className="animate-editorial-shell mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
          <div
            className="rounded-[var(--radius-editorial)] bg-surface px-6 pb-32 pt-12 sm:px-14 sm:pb-44 sm:pt-16 lg:px-20 lg:pt-20"
            style={{ boxShadow: "var(--shadow-float-lg)" }}
          >
            <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
              {/* Left — typography and action */}
              <div>
                <p
                  className="animate-editorial-rise text-xs font-semibold uppercase tracking-[0.18em] text-accent"
                  style={{ animationDelay: "120ms" }}
                >
                  {t("heroKicker")}
                </p>
                <h1
                  className="animate-editorial-rise mt-5 text-balance font-editorial text-[2.6rem] font-semibold leading-[1.05] text-accent sm:text-6xl"
                  style={{ animationDelay: "200ms" }}
                >
                  {t("heroTitle")}
                </h1>
                <div
                  className="animate-editorial-rise mt-9 flex flex-wrap items-center gap-3"
                  style={{ animationDelay: "360ms" }}
                >
                  <Link
                    href="/about"
                    className="lift flex cursor-pointer items-center gap-2 rounded-full border border-rule bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <Info className="h-4 w-4 text-accent" />
                    {tNav("about")}
                  </Link>
                  <Link
                    href="/membership"
                    className="lift cursor-pointer rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {t("heroCtaJoin")}
                  </Link>
                </div>
              </div>

              {/* Right — editorial copy */}
              <div
                className="animate-editorial-rise lg:border-s lg:border-rule lg:ps-16"
                style={{ animationDelay: "280ms" }}
              >
                <p className="text-lg leading-[1.75] text-ink-soft">{t("heroSubtitle")}</p>
                <Link
                  href="/restaurants"
                  className="mt-7 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {t("heroCtaDirectory")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </div>

          {/* Asymmetric photo pair breaking the card's lower boundary. The card
              reserves matching bottom padding so these never cover its CTAs. */}
          <div className="-mt-20 flex justify-center gap-4 px-2 sm:-mt-28 sm:gap-6">
            {heroShowcase.map((img, i) => (
              <div
                key={img.src}
                className={`zoom-frame relative overflow-hidden rounded-3xl border-4 border-surface bg-surface-2 ${
                  i === 0
                    ? "h-40 w-1/2 max-w-sm sm:h-60 sm:max-w-md"
                    : "mt-8 h-32 w-2/5 max-w-[16rem] sm:mt-14 sm:h-48 sm:max-w-sm"
                }`}
                style={{
                  boxShadow: "var(--shadow-float)",
                  animation: `editorial-rise 760ms var(--ease-editorial) ${520 + i * 120}ms both`,
                }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 448px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sector services */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-semibold text-ink">
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

      {/* Stats */}
      <section className="border-y border-rule bg-surface-2">
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
      <section className="border-t border-rule bg-ink text-paper">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-2xl font-semibold">{t("newsletterTitle")}</h2>
          <p className="mt-2 text-paper/70">{t("newsletterSubtitle")}</p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
