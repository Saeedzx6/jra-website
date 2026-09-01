import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { NewsletterForm } from "@/components/newsletter-form";
import { HeroVideo } from "@/components/home/hero-video";
import { SearchConsole } from "@/components/search/search-console";
import { EntryCard } from "@/components/directory/entry-card";
import { Rail } from "@/components/home/rail";
import { Stats } from "@/components/home/stats";
import { NewsGrid } from "@/components/home/news-grid";
import { MembershipDeck } from "@/components/home/membership-deck";
import { getFeaturedRestaurants } from "@/lib/restaurants";
import { getDirectoryVocab } from "@/lib/directory-vocab";
import { db } from "@/lib/db";
import styles from "./home.module.css";

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
  const tNews = await getTranslations("newsCategory");

  const [
    featured,
    restaurantCount,
    supplierCount,
    representedGovernorates,
    latestNews,
    vocab,
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
    // Cuisines, governorates, features and the suggestion index behind the
    // hero's search console.
    getDirectoryVocab(locale),
  ]);

  const governorateCount = representedGovernorates.length;

  /**
   * Two of these come from the directory and two do not.
   *
   * Member restaurants and governorates covered are counted from published
   * records, so they cannot drift from what the directory actually shows.
   * Employment and sector value are association figures with no column behind
   * them — they are stated here rather than invented from a query that would
   * only look authoritative.
   */
  const sectorStats = [
    { value: restaurantCount + supplierCount, label: t("statMembers") },
    { value: 42000, suffix: "+", label: t("statEmployed") },
    { value: governorateCount, label: t("statGovernorates") },
    { value: 1.4, suffix: "B JOD", decimals: 1, label: t("statSectorValue") },
  ];

  const newsCards = latestNews.map((n) => ({
    slug: n.slug,
    kicker: tNews(n.category === "PRESS_RELEASE" ? "pressRelease" : "news"),
    date: n.publishedAt ? n.publishedAt.toISOString() : null,
    title: n.translations[0]?.title ?? n.slug,
    excerpt: n.translations[0]?.excerpt ?? null,
    image: n.coverImageUrl ?? null,
  }));

  const membershipSlides = [
    {
      eyebrow: t("whyJoinEyebrow"),
      title: t("whyJoinTitle"),
      body: t("whyJoinBody"),
      cta: t("whyJoinCta"),
      image: "/brand/jra-showcase-kitchen.png",
    },
  ];

  return (
    /* Paper the whole way down. The page used to open on a navy-to-paper
       descent spanning the hero and the services grid; with the hero carrying
       its own scrim and the services grid gone, that descent had nothing left
       to fade between. */
    <div className="bg-paper">
      {/* Pulled up under the fixed header so the photography runs behind it
          and the header can sit transparent over it. The hero's own top
          padding is measured against --header-h, so the copy still clears it.
          The navy-to-paper descent that used to wrap this is gone: the hero
          now carries its own two-layer scrim, and a second gradient outside
          it was fighting the first. */}
      <div className="-mt-[var(--header-h)]">
      {/* --- hero: full-bleed video, display headline, working console ------
          The search bar is the CTA. This is a directory product twice over,
          so finding a listing is the primary task and the console is the
          hero's payload rather than an ornament beneath it. */}
      <section className="hero">
        <div className="hero-media">
          <HeroVideo />
        </div>

        <div className="wrap">
          <h1 className="display">{t("heroTitle")}</h1>
          <p className="lede">{t("heroLede")}</p>

          {/* showNote={false}: the console's "Indexing 701 establishments ·
              22 cuisines · …" line is counted inventory, not help. The home
              page does not lead with figures. */}
          <div className={styles.heroConsole}>
            <SearchConsole vocab={vocab} showNote={false} />
          </div>
        </div>
      </section>
      </div>

      {/* The four-tile services grid that used to sit here has been removed.
          Directory, Classification, Membership and Sustainability are all in
          the header nav and on their own pages, and the tile that pointed at
          the directory duplicated the rail immediately below it. Three routes
          to the same place is not more helpful than one — so the rail is now
          the page's centre, directly under the hero. */}

      {/* --- member restaurants: the rail is the page's centre ------------ */}
      {featured.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className={styles.railHead}>
              <div>
                <span className="eyebrow" style={{ color: "var(--accent)" }}>
                  {t("directoryEyebrow")}
                </span>
                <h2 className="display" style={{ fontSize: "clamp(2.1rem, 5vw, 3.25rem)" }}>
                  {t("directoryTitle")}
                </h2>
              </div>
              <Link href="/restaurants" className="btn btn-outline">
                {t("viewAllRestaurants")}
              </Link>
            </div>

            <Rail>
              {featured.map((restaurant) => (
                <li key={restaurant.slug}>
                  <EntryCard entry={restaurant} variant="rail" />
                </li>
              ))}
            </Rail>
          </div>
        </section>
      )}

      {/* --- the sector, measured ----------------------------------------- */}
      <section className="section stats">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t("statsEyebrow")}</span>
            <h2 className="display">{t("statsTitle")}</h2>
          </div>
          <Stats stats={sectorStats} />
        </div>
      </section>

      {/* --- news ---------------------------------------------------------- */}
      {newsCards.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">{t("newsEyebrow")}</span>
              <h2 className="display">{t("newsTitle")}</h2>
            </div>

            <NewsGrid articles={newsCards} />

            <div className="centered">
              <Link href="/news" className="btn btn-outline">
                {t("allNews")}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* --- membership ---------------------------------------------------- */}
      <MembershipDeck slides={membershipSlides} />

      {/* --- newsletter ---------------------------------------------------- */}
      <section className="section signup">
        <div className="wrap">
          <div className="signup-grid">
            <div>
              <span className="eyebrow" style={{ color: "var(--accent)" }}>
                {t("newsletterEyebrow")}
              </span>
              <h2 className="display">{t("newsletterTitle")}</h2>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}
