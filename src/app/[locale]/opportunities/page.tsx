import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarClock } from "lucide-react";
import { db } from "@/lib/db";

// Cached and revalidated every 3600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 3600;

export default async function OpportunitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const to = await getTranslations("opportunities");

  const opportunities = await db.resource.findMany({
    where: { status: "PUBLISHED", type: "OPPORTUNITY" },
    include: { translations: true },
    orderBy: { deadlineAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">{t("opportunities")}</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">{to("description")}</p>

      {opportunities.length === 0 ? (
        <p className="mt-16 text-center text-ink-soft">{tCommon("noResults")}</p>
      ) : (
        <div className="mt-8 space-y-3">
          {opportunities.map((o) => {
            const tr = o.translations.find((t) => t.locale === locale) ?? o.translations[0];
            const expired = o.deadlineAt && o.deadlineAt < new Date();
            return (
              <div key={o.id} className="flex items-start justify-between rounded-2xl border border-rule bg-surface p-5">
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">
                    {tr?.title ?? o.slug}
                  </h3>
                  {tr?.summary ? <p className="mt-1 text-sm text-ink-soft">{tr.summary}</p> : null}
                </div>
                {o.deadlineAt ? (
                  <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${expired ? "bg-surface-2 text-ink-faint" : "bg-warning-soft text-warning-text"}`}>
                    <CalendarClock className="h-3.5 w-3.5" />
                    {new Date(o.deadlineAt).toLocaleDateString(locale)}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
