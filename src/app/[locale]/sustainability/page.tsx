import { getLocale, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { CardGrid } from "@/components/layout/Cards";
import { sustainabilityTopics } from "@/lib/modules";
import { destinations, pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export default async function SustainabilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const activeLocale = (await getLocale()) as Locale;
  const destination = destinations.find((d) => d.key === "sustainability")!;

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
          <CardGrid items={sustainabilityTopics} columns={3} />
        </div>
      </section>
    </>
  );
}
