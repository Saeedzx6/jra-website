import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { CardGrid } from "@/components/layout/Cards";
import { projects } from "@/lib/modules";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tMod = await getTranslations("modules");

  const items = projects.map((project) => ({
    title: project.title,
    body: project.body,
    meta: {
      en: `${project.status.en} · ${project.year}`,
      ar: `${project.status.ar} · ${project.year}`,
    },
  }));

  return (
    <>
      <PageHero
        title={tMod("projects")}
        crumbs={[{ label: "JRA", href: "/" }, { label: tMod("projects") }]}
      />

      <section className="section">
        <div className="wrap">
          <CardGrid items={items} columns={3} />
        </div>
      </section>
    </>
  );
}
