import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { CardGrid, NoticeList } from "@/components/layout/Cards";
import { legislation } from "@/lib/modules";
import { alerts, destinations, pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const activeLocale = (await getLocale()) as Locale;
  const tMod = await getTranslations("modules");
  const destination = destinations.find((d) => d.key === "legal")!;

  // Reshape the legislation records into the shared card contract.
  const items = legislation.map((entry) => ({
    title: entry.title,
    body: entry.body,
    meta: {
      en: `${entry.type.en} · ${entry.year}`,
      ar: `${entry.type.ar} · ${entry.year}`,
    },
  }));

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
            <h2 className="display">{tMod("legislation")}</h2>
          </div>
          <CardGrid items={items} columns={2} />
        </div>
      </section>

      <section className="section" style={{ background: "var(--blue-50)" }}>
        <div className="wrap">
          <div className="section-head">
            <h2 className="display">{tMod("alerts")}</h2>
          </div>
          <NoticeList items={alerts} tone="alert" />
        </div>
      </section>
    </>
  );
}
