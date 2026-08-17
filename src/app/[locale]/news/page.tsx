import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { NewsGrid } from "@/components/home/NewsGrid";
import { NoticeList } from "@/components/layout/Cards";
import { alerts, opportunities } from "@/lib/content";

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("nav");
  const tHome = await getTranslations("home");
  const tMod = await getTranslations("modules");

  return (
    <>
      <PageHero
        eyebrow={t("mediaCenter")}
        title={tHome("newsTitle")}
        crumbs={[{ label: "JRA", href: "/" }, { label: t("mediaCenter") }]}
      />

      <section className="section">
        <div className="wrap">
          <NewsGrid />
        </div>
      </section>

      {/* Alerts and opportunities sit together here, as in Direction C, so the
          regulatory stream has a home outside the destination tiles. */}
      <section className="section" style={{ background: "var(--blue-50)" }}>
        <div className="wrap">
          <div className="grid cols-2">
            <div>
              <h2 className="display" style={{ fontSize: "1.75rem", marginBlockEnd: "1.25rem" }}>
                {tMod("alerts")}
              </h2>
              <NoticeList items={alerts} tone="alert" />
            </div>
            <div>
              <h2 className="display" style={{ fontSize: "1.75rem", marginBlockEnd: "1.25rem" }}>
                {tMod("opportunities")}
              </h2>
              <NoticeList items={opportunities} tone="good" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
