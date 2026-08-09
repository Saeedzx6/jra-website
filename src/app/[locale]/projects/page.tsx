import { getTranslations, setRequestLocale } from "next-intl/server";
import { FolderKanban } from "lucide-react";
import { db } from "@/lib/db";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const tp = await getTranslations("projects");

  const projects = await db.resource.findMany({
    where: { status: "PUBLISHED", type: { in: ["PROJECT", "CASE_STUDY"] } },
    include: { translations: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">{t("projects")}</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">{tp("description")}</p>

      {projects.length === 0 ? (
        <p className="mt-16 text-center text-ink-soft">{tCommon("noResults")}</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {projects.map((p) => {
            const tr = p.translations.find((t) => t.locale === locale) ?? p.translations[0];
            return (
              <div key={p.id} className="rounded-2xl border border-rule bg-surface p-5">
                <FolderKanban className="h-5 w-5 text-accent" />
                <h3 className="mt-2 font-display text-base font-semibold text-ink">
                  {tr?.title ?? p.slug}
                </h3>
                {tr?.summary ? <p className="mt-1 text-sm text-ink-soft">{tr.summary}</p> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
