import {
  getFormatter,
  getLocale,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { CardGrid } from "@/components/layout/Cards";
import { courses } from "@/lib/modules";
import { pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const activeLocale = (await getLocale()) as Locale;
  const t = await getTranslations("nav");
  const tMod = await getTranslations("modules");
  const format = await getFormatter();

  const items = courses.map((course) => {
    const starts = format.dateTime(new Date(course.starts), {
      day: "numeric",
      month: "short",
    });
    return {
      title: course.title,
      body: course.body,
      meta: {
        en: `${course.city} · ${course.duration.en} · ${starts}`,
        ar: `${course.city} · ${course.duration.ar} · ${starts}`,
      },
    };
  });

  return (
    <>
      <PageHero
        eyebrow={t("training")}
        title={t("training")}
        lede={pick(courses[0].body, activeLocale)}
        crumbs={[{ label: "JRA", href: "/" }, { label: t("training") }]}
      />

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2 className="display">{tMod("courses")}</h2>
          </div>
          <CardGrid items={items} columns={2} />
        </div>
      </section>
    </>
  );
}
