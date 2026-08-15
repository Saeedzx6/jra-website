import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { CardGrid } from "@/components/layout/Cards";
import { membershipTypes, membershipBenefits } from "@/lib/modules";
import { pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";
import styles from "./page.module.css";

export default async function MembershipPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const activeLocale = (await getLocale()) as Locale;
  const t = await getTranslations("nav");

  return (
    <>
      <PageHero
        eyebrow={t("membership")}
        title={t("membership")}
        lede={pick(membershipTypes[0].body, activeLocale)}
        crumbs={[{ label: "JRA", href: "/" }, { label: t("membership") }]}
      />

      <section className="section">
        <div className="wrap">
          <ul className={styles.types}>
            {membershipTypes.map((type) => (
              <li key={type.title.en} className={styles.type}>
                <span className={styles.meta}>
                  {type.meta && pick(type.meta, activeLocale)}
                </span>
                <h2 className="display">{pick(type.title, activeLocale)}</h2>
                <p>{pick(type.body, activeLocale)}</p>
                <Link href="/membership#apply" className="btn">
                  {pick(type.cta, activeLocale)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="apply">
        <div className="wrap">
          <div className="section-head">
            <h2 className="display">{pick(membershipTypes[0].title, activeLocale)}</h2>
          </div>
          <CardGrid items={membershipBenefits} columns={2} />
        </div>
      </section>
    </>
  );
}
