import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CoverThumb } from "@/components/cover-thumb";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/page-metadata";

// Cached and revalidated every 900s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 900;

export const generateMetadata = pageMetadata("/news", "news");

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
      <h1 className="font-display text-5xl text-ink">{t("news")}</h1>

      {articles.length === 0 ? (
        <p className="mt-12 text-center text-ink-soft">{tCommon("noResults")}</p>
      ) : (
        /* Monad's article index: a 2-up grid on parchment, cards bounded by a
           hairline rather than a divider. The cover leads — which is the
           point of giving every article an image. */
        <div className="stagger mt-10 grid gap-6 sm:grid-cols-2">
          {articles.map((a, i) => {
            const title = a.translations[0]?.title ?? a.slug;
            return (
              <Link
                key={a.id}
                href={`/news/${a.slug}`}
                className="motion-card group flex flex-col overflow-hidden rounded-2xl border border-rule bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <CoverThumb
                  url={a.coverImageUrl}
                  /* Decorative: the heading immediately below names the article,
                     so alt text here would just repeat it. */
                  alt=""
                  seed={a.slug}
                  title={title}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  priority={i < 2}
                />
                <div className="flex flex-1 flex-col p-6 sm:p-10">
                  {a.publishedAt ? (
                    <time className="ui-caps text-ink-faint">
                      {new Date(a.publishedAt).toLocaleDateString(locale)}
                    </time>
                  ) : null}
                  <h2 className="mt-2 font-display text-2xl text-ink">{title}</h2>
                  {a.translations[0]?.excerpt ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-soft">
                      {a.translations[0].excerpt}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
