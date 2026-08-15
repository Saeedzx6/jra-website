import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { Prose } from "@/components/layout/Cards";
import { Stats } from "@/components/home/Stats";
import { People } from "@/components/about/People";
import { about } from "@/lib/modules";
import { board, team } from "@/lib/organisation";
import { pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const activeLocale = (await getLocale()) as Locale;
  const t = await getTranslations("nav");
  const tHome = await getTranslations("home");
  const tAbout = await getTranslations("about");

  return (
    <>
      <PageHero
        title={pick(about.intro.title, activeLocale)}
        lede={pick(about.intro.lede, activeLocale)}
        crumbs={[{ label: "JRA", href: "/" }, { label: t("about") }]}
      />

      <section className="section">
        <div className="wrap">
          <Prose sections={about.sections} />
        </div>
      </section>

      {/* Governance: who is accountable, with faces. */}
      <section className="section" id="board" style={{ background: "var(--blue-50)" }}>
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t("about")}</span>
            <h2 className="display">{tAbout("board")}</h2>
            <p className="lede">{tAbout("boardLede")}</p>
          </div>
          <People people={board} leadFirst />
        </div>
      </section>

      <section className="section" id="team">
        <div className="wrap">
          <div className="section-head">
            <h2 className="display">{tAbout("team")}</h2>
            <p className="lede">{tAbout("teamLede")}</p>
          </div>
          <People people={team} />

          <div style={{ display: "flex", justifyContent: "center", marginBlockStart: "2.5rem" }}>
            {/* The live site publishes staff email addresses behind Cloudflare
                obfuscation; we route through the contact form instead rather
                than republish them. */}
            <Link href="/contact" className="btn btn-outline">
              {tAbout("contactTeam")}
            </Link>
          </div>
        </div>
      </section>

      <section className="section stats">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow" style={{ color: "var(--pale)" }}>
              {tHome("statsEyebrow")}
            </span>
            <h2 className="display">{tHome("statsTitle")}</h2>
          </div>
          <Stats />
        </div>
      </section>
    </>
  );
}
