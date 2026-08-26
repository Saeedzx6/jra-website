import { getTranslations, setRequestLocale } from "next-intl/server";
import { Scale } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";

// Cached and revalidated every 3600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 3600;

export default async function LegalHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const tl = await getTranslations("legal");
  const tType = await getTranslations("legalTypes");
  const { type } = await searchParams;

  const documents = await db.legalDocument.findMany({
    where: type ? { type: type as never } : undefined,
    orderBy: { year: "desc" },
    include: { versions: { orderBy: { publishedAt: "desc" }, take: 1 } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">{t("legal")}</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">{tl("description")}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/legal" className={`rounded-full px-3 py-1.5 text-sm ${!type ? "bg-accent text-white" : "border border-rule text-ink-soft"}`}>
          {tl("all")}
        </Link>
        {(["LAW", "REGULATION", "INSTRUCTION"] as const).map((key) => (
          <Link key={key} href={`/legal?type=${key}`} className={`rounded-full px-3 py-1.5 text-sm ${type === key ? "bg-accent text-white" : "border border-rule text-ink-soft"}`}>
            {tType(key)}
          </Link>
        ))}
      </div>

      {documents.length === 0 ? (
        <p className="mt-16 text-center text-ink-soft">{tCommon("noResults")}</p>
      ) : (
        <div className="reveal mt-8 divide-y divide-rule rounded-2xl border border-rule bg-surface">
          {documents.map((d) => (
            <Link key={d.id} href={`/legal/${d.slug}`} className="flex items-center gap-3 px-5 py-4 hover:bg-surface-2/40">
              <Scale className="h-4 w-4 shrink-0 text-accent" />
              <div className="flex-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-brass-text">
                  {tType(d.type)} {d.year ? `· ${d.year}` : ""}
                </span>
                <p className="text-sm font-medium text-ink">
                  {d.topic ?? d.slug} {d.versions[0] ? `— v${d.versions[0].versionLabel}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
