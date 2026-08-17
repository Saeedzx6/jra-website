import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { featuredRestaurants } from "@/lib/directory";

import { HeroVideo } from "@/components/home/HeroVideo";
import { SearchConsole } from "@/components/search/SearchConsole";
import { Stats } from "@/components/home/Stats";
import { Rail } from "@/components/home/Rail";
import { NewsGrid } from "@/components/home/NewsGrid";
import { MembershipDeck } from "@/components/home/MembershipDeck";
import { NewsletterForm } from "@/components/home/NewsletterForm";
import { EntryCard } from "@/components/directory/EntryCard";

import styles from "./page.module.css";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const featured = featuredRestaurants();

  return (
    <>
      {/* --- hero: full-bleed video, display headline, working console ------ */}
      <section className="hero">
        <div className="hero-media">
          <HeroVideo />
        </div>

        <div className="wrap">
          {/* The brand tagline used to sit here as an eyebrow. It said "The
              official body of Jordan's tourist restaurants" directly above a
              lede opening "The official body of Jordan's restaurant sector" —
              the same sentence twice, stacked. The lede keeps it. */}
          <h1 className="display">{t("heroTitle")}</h1>
          <p className="lede">{t("heroLede")}</p>

          {/* showNote={false}: the console's "Indexing 718 establishments · 17
              cuisines · …" line is counted inventory, not help. The home page
              no longer leads with figures. */}
          <div className={styles.heroConsole}>
            <SearchConsole showNote={false} lockScope />
          </div>
        </div>
      </section>

      {/* The five quick-access pills that used to sit here have been removed.
          They offered the same actions a third time: the search console above
          already covers "find a restaurant" and "find a supplier", and three of
          the five pills pointed at destinations the tile grid below repeats.
          Three routes to the same place is not more helpful than one. */}

      {/* The six-destination tile grid has been removed. Suppliers,
          Classification, Sustainability, Legal and Marketplace all come off
          the home page — they remain in the header nav and on their own
          pages. That left a single Restaurant Directory tile, which is both a
          broken three-column grid and a duplicate of the rail immediately
          below it, so the rail is now the page's centre. */}

      {/* --- member restaurants --------------------------------------------- */}
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
            {/* Was mislabelled: this rendered "six ways in" — the tile
                section's heading — on a link to the restaurant directory. */}
            <Link href="/restaurants" className="btn btn-outline">
              {t("viewAllRestaurants")}
            </Link>
          </div>

          <Rail>
            {featured.map((restaurant) => (
              <li key={restaurant.slug}>
                <EntryCard entry={restaurant} kind="restaurants" variant="rail" />
              </li>
            ))}
          </Rail>
        </div>
      </section>

      {/* --- the sector, measured ------------------------------------------- */}
      <section className="section stats">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow" style={{ color: "var(--pale)" }}>
              {t("statsEyebrow")}
            </span>
            <h2 className="display">{t("statsTitle")}</h2>
          </div>
          <Stats />
        </div>
      </section>

      {/* --- news ------------------------------------------------------------ */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t("newsEyebrow")}</span>
            <h2 className="display">{t("newsTitle")}</h2>
          </div>

          <NewsGrid />

          <div className={styles.centered}>
            <Link href="/news" className="btn btn-outline">
              {t("allNews")}
            </Link>
          </div>
        </div>
      </section>

      {/* --- membership ------------------------------------------------------ */}
      <MembershipDeck />

      {/* --- newsletter ------------------------------------------------------ */}
      <section className={`section ${styles.signup}`}>
        <div className="wrap">
          <div className={styles.signupGrid}>
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
    </>
  );
}
