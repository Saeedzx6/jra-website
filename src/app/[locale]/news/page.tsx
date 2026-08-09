import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";

export default async function NewsListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  const articles = await db.newsArticle.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: { translations: { where: { locale: locale === "ar" ? "ar" : "en" } } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">{t("news")}</h1>

      {articles.length === 0 ? (
        <p className="mt-12 text-center text-ink-soft">{tCommon("noResults")}</p>
      ) : (
        <div className="mt-8 divide-y divide-rule">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/news/${a.slug}`}
              className="block py-6 transition-colors hover:bg-surface-2/40"
            >
              {a.publishedAt ? (
                <time className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  {new Date(a.publishedAt).toLocaleDateString(locale)}
                </time>
              ) : null}
              <h2 className="mt-1 font-display text-xl font-semibold text-ink">
                {a.translations[0]?.title ?? a.slug}
              </h2>
              {a.translations[0]?.excerpt ? (
                <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
                  {a.translations[0].excerpt}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
