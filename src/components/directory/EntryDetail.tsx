import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  mapsUrl,
  photosOf,
  type Restaurant,
  type Supplier,
} from "@/lib/directory";
import { PageHero } from "@/components/layout/PageHero";
import { ContactActions } from "./ContactActions";
import { Gallery } from "./Gallery";
import { OpeningHours } from "./OpeningHours";
import styles from "./EntryDetail.module.css";

export async function EntryDetail({
  entry,
  kind,
}: {
  entry: Restaurant | Supplier;
  kind: "restaurants" | "suppliers";
}) {
  const t = await getTranslations("nav");
  const tSearch = await getTranslations("search");
  const tDir = await getTranslations("directory");

  const isRestaurant = "cuisine" in entry;
  const category = isRestaurant ? entry.cuisine : entry.trade;
  const categoryLabel = isRestaurant ? tSearch("cuisine") : tSearch("trade");
  const photos = photosOf(entry);

  return (
    <>
      <PageHero
        eyebrow={category}
        title={entry.name}
        crumbs={[
          { label: "JRA", href: "/" },
          { label: t(kind), href: `/${kind}` },
          { label: entry.name },
        ]}
      />

      <section className="section">
        <div className="wrap">
          <div className={styles.layout}>
            {/* ---------------- narrative column ---------------- */}
            <div>
              <div className={styles.identity}>
                {entry.logo && (
                  <Image
                    src={entry.logo}
                    alt=""
                    width={88}
                    height={88}
                    className={styles.logo}
                  />
                )}
                <div>
                  <h2 className={`display ${styles.title}`}>
                    <bdi dir="auto">{entry.name}</bdi>
                  </h2>
                  <p className={styles.meta}>
                    {category && <bdi dir="auto">{category}</bdi>}
                    {category && entry.city && (
                      <span className={styles.dot} aria-hidden="true" />
                    )}
                    {entry.city && <bdi dir="auto">{entry.city}</bdi>}
                    <span className={styles.dot} aria-hidden="true" />
                    <span>{tDir("photos", { count: photos.length })}</span>
                  </p>
                </div>
              </div>

              {entry.blurb && (
                <div className={styles.block}>
                  <h3 className={styles.blockTitle}>{tDir("aboutThis")}</h3>
                  <p className={styles.blurb}>{entry.blurb}</p>
                </div>
              )}

              <div className={styles.block}>
                <h3 className={styles.blockTitle}>{tDir("gallery")}</h3>
                <Gallery photos={photos} name={entry.name} />
              </div>

              {entry.tags.length > 0 && (
                <div className={styles.block}>
                  <h3 className={styles.blockTitle}>{tDir("features")}</h3>
                  <ul className={styles.tags}>
                    {entry.tags.map((tag) => (
                      <li key={tag} className="tag">
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ---------------- practical panel ---------------- */}
            <aside className={styles.panel}>
              <div className={styles.panelSection}>
                <h3 className={styles.panelTitle}>{tDir("contact")}</h3>

                <ContactActions slug={entry.slug} name={entry.name} />

                <address className={styles.address}>
                  <bdi dir="auto">
                    {entry.address || entry.city || tDir("address")}
                  </bdi>
                </address>
                {/* Real working link, no API key and no invented coordinates. */}
                <a
                  className={styles.mapLink}
                  href={mapsUrl(entry)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  {tDir("viewOnMap")}
                  <span className="sr-only"> ({entry.name})</span>
                </a>
              </div>

              <div className={styles.divider} />

              <div className={styles.panelSection}>
                <h3 className={styles.panelTitle}>{categoryLabel}</h3>
                <p>
                  <bdi dir="auto">{category || "—"}</bdi>
                </p>
              </div>

              {/* Suppliers do not trade on opening hours the way a restaurant
                  does, so the panel only carries them where they matter. */}
              {isRestaurant && (
                <>
                  <div className={styles.divider} />
                  <div className={styles.panelSection}>
                    <h3 className={styles.panelTitle}>{tDir("openingHours")}</h3>
                    <OpeningHours />
                  </div>
                </>
              )}

              <div className={styles.divider} />

              <Link href={`/${kind}`} className={styles.backLink}>
                <svg
                  className="mirror"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M15 5l-7 7 7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {t(kind)}
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
