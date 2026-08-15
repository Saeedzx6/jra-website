import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { Listings } from "@/components/marketplace/Listings";
import { destinations, brand, pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";
import styles from "@/components/marketplace/Listings.module.css";

export default async function MarketplacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const activeLocale = (await getLocale()) as Locale;
  const tMod = await getTranslations("modules");
  const destination = destinations.find((d) => d.key === "marketplace")!;

  return (
    <>
      <PageHero
        eyebrow={pick(destination.eyebrow, activeLocale)}
        title={pick(destination.title, activeLocale)}
        lede={pick(destination.body, activeLocale)}
        crumbs={[
          { label: "JRA", href: "/" },
          { label: pick(destination.eyebrow, activeLocale) },
        ]}
      />

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2 className="display">{tMod("listings")}</h2>
          </div>
          <Listings />
        </div>
      </section>

      {/* The live site's /advertisements page is an "Advertise Here" enquiry
          page rather than an ad listing, so it belongs here as a panel, not as
          a competing second classifieds route. */}
      <section className="section" style={{ paddingBlockStart: 0 }}>
        <div className="wrap">
          <div className={styles.advertise}>
            <h2 className="display">{tMod("advertiseTitle")}</h2>
            <p>{tMod("advertiseLede")}</p>
            <p className={styles.advertisePhone} dir="ltr">
              {brand.phone}
            </p>
            <Link href="/contact" className="btn btn-light">
              {tMod("advertiseCta")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
