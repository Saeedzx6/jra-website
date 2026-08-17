import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { NoticeList } from "@/components/layout/Cards";
import { opportunities } from "@/lib/content";

export default async function OpportunitiesPage({
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
        title={tMod("opportunities")}
        lede={tMod("opportunities")}
        crumbs={[{ label: "JRA", href: "/" }, { label: tMod("opportunities") }]}
      />

      <section className="section">
        <div className="wrap">
          <NoticeList items={opportunities} tone="good" />
        </div>
      </section>
    </>
  );
}
