import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { SelfAssessment } from "@/components/classification/SelfAssessment";

export default async function ClassificationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("classification");

  return (
    <>
      <PageHero
        eyebrow={t("title")}
        title={t("assessmentTitle")}
        lede={t("lede")}
        crumbs={[{ label: "JRA", href: "/" }, { label: t("title") }]}
      />

      <section className="section">
        <div className="wrap">
          <SelfAssessment />
        </div>
      </section>
    </>
  );
}
