import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { annualReports } from "@/lib/organisation";
import styles from "./page.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("reports") };
}

export default async function AnnualReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");
  const tNav = await getTranslations("nav");

  // Newest first, regardless of source order.
  const reports = [...annualReports].sort((a, b) => b.year - a.year);

  return (
    <>
      <PageHero
        eyebrow={tNav("about")}
        title={t("reports")}
        lede={t("reportsLede")}
        crumbs={[
          { label: "JRA", href: "/" },
          { label: tNav("about"), href: "/about" },
          { label: t("reports") },
        ]}
      />

      <section className="section">
        <div className="wrap">
          {reports.length === 0 ? (
            <p>{t("noReports")}</p>
          ) : (
            <ul className={styles.list}>
              {reports.map((report) => (
                <li key={report.year} className={styles.report}>
                  <span className={styles.year} aria-hidden="true">
                    {report.year}
                  </span>

                  <div className={styles.detail}>
                    <h2 className={styles.title}>
                      {t("reportYear", { year: report.year })}
                    </h2>
                    <p className={styles.meta}>
                      {t("fileSize", { size: report.sizeMb })}
                    </p>
                  </div>

                  {/* A cross-origin PDF: `download` is advisory only, so this is
                      an ordinary link. The accessible name carries the year and
                      size so a screen-reader user is not offered four
                      indistinguishable "Download PDF" links. */}
                  <a
                    className={`btn ${styles.action}`}
                    href={report.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("download")}
                    <span className="sr-only">
                      {" "}
                      {t("reportYear", { year: report.year })},{" "}
                      {t("fileSize", { size: report.sizeMb })}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
