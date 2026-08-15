import {
  getFormatter,
  getLocale,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { magazineIssues } from "@/lib/modules";
import { pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";
import styles from "./page.module.css";

export default async function MagazinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const activeLocale = (await getLocale()) as Locale;
  const tMod = await getTranslations("modules");
  const format = await getFormatter();

  return (
    <>
      <PageHero
        title={tMod("magazine")}
        crumbs={[{ label: "JRA", href: "/" }, { label: tMod("magazine") }]}
      />

      <section className="section">
        <div className="wrap">
          <ul className={styles.issues}>
            {magazineIssues.map((issue) => (
              <li key={issue.issue} className={styles.issue}>
                <div className={styles.cover} aria-hidden="true">
                  <span>{issue.issue}</span>
                </div>

                <div className={styles.body}>
                  <p className={styles.meta}>
                    {tMod("issue", { number: issue.issue })} ·{" "}
                    {format.dateTime(new Date(issue.date), {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <h2>{pick(issue.title, activeLocale)}</h2>
                  <p>{pick(issue.body, activeLocale)}</p>
                  {/* Access level is stated in text, not implied by a colour
                      or a lock glyph alone. */}
                  <span
                    className="tag"
                    data-members={issue.membersOnly ? "true" : undefined}
                  >
                    {issue.membersOnly ? tMod("membersOnly") : tMod("public")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
