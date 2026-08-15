import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { CardGrid } from "@/components/layout/Cards";
import { knowledge } from "@/lib/modules";

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tMod = await getTranslations("modules");

  const items = knowledge.map((entry) => ({
    title: entry.title,
    body: entry.body,
    meta: entry.kind,
  }));

  return (
    <>
      <PageHero
        title={tMod("knowledge")}
        crumbs={[{ label: "JRA", href: "/" }, { label: tMod("knowledge") }]}
      />

      <section className="section">
        <div className="wrap">
          <CardGrid items={items} columns={2} />
        </div>
      </section>
    </>
  );
}
