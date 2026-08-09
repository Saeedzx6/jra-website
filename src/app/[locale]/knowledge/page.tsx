import { getTranslations, setRequestLocale } from "next-intl/server";
import { FileText } from "lucide-react";
import { db } from "@/lib/db";

export default async function KnowledgeCenterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tk = await getTranslations("knowledge");
  const tType = await getTranslations("resourceTypes");

  const resources = await db.resource.findMany({
    where: { status: "PUBLISHED", type: { in: ["STUDY", "GUIDE", "HR_MANUAL"] } },
    include: { translations: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">{t("knowledge")}</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">{tk("description")}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {resources.map((r) => {
          const tr = r.translations.find((t) => t.locale === locale) ?? r.translations[0];
          return (
            <a
              key={r.id}
              href={r.fileUrl ?? "#"}
              className="motion-card flex items-start gap-3 rounded-xl border border-rule bg-surface p-4"
            >
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-brass">
                  {tType(r.type)}
                </span>
                <p className="text-sm font-medium text-ink">{tr?.title ?? r.slug}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
