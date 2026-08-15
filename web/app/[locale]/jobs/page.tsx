import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";

/**
 * Per the WRD, the association does not duplicate the recruitment platform —
 * this module informs and hands off to SiyahaJobs. The outbound link is
 * marked as leaving the site rather than looking like internal navigation.
 */
export default async function JobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tMod = await getTranslations("modules");

  return (
    <>
      <PageHero
        title={tMod("jobsTitle")}
        lede={tMod("jobsLede")}
        crumbs={[{ label: "JRA", href: "/" }, { label: tMod("jobsTitle") }]}
      />

      <section className="section">
        <div className="wrap">
          <a
            className="btn"
            href="https://siyahajobs.jo"
            target="_blank"
            rel="noopener noreferrer"
          >
            {tMod("jobsCta")}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 17L17 7M17 7H9M17 7v8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </section>
    </>
  );
}
