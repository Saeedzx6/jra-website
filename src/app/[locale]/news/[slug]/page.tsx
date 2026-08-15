import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { buildMetadata, toDescription } from "@/lib/seo";
import { jsonLdScript, newsArticleLd } from "@/lib/json-ld";

export const revalidate = 3600;

function articleFor(slug: string, locale: string) {
  return db.newsArticle.findUnique({
    where: { slug },
    include: {
      translations: { where: { locale: locale === "ar" ? "ar" : "en" } },
      author: { select: { fullName: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await articleFor(slug, locale);
  const tr = article?.translations[0];

  if (!article || article.status !== "PUBLISHED" || !tr) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }

  return buildMetadata({
    locale,
    path: `/news/${slug}`,
    title: tr.title,
    description: tr.excerpt ?? toDescription(tr.bodyHtml),
    image: article.coverImageUrl,
    type: "article",
    publishedTime: article.publishedAt,
  });
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = await articleFor(slug, locale);

  if (!article || article.status !== "PUBLISHED") notFound();
  const tr = article.translations[0];
  if (!tr) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            newsArticleLd(
              {
                slug,
                title: tr.title,
                excerpt: tr.excerpt,
                coverImageUrl: article.coverImageUrl,
                publishedAt: article.publishedAt,
                authorName: article.author?.fullName ?? null,
              },
              locale
            )
          ),
        }}
      />
      {article.publishedAt ? (
        <time className="text-xs font-medium uppercase tracking-wide text-ink-faint">
          {new Date(article.publishedAt).toLocaleDateString(locale)}
        </time>
      ) : null}
      <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink">
        {tr.title}
      </h1>
      {article.coverImageUrl ? (
        <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-surface-2">
          <Image src={article.coverImageUrl} alt={tr.title} fill className="object-cover" />
        </div>
      ) : null}
      <div
        className="prose mt-8 max-w-none leading-relaxed text-ink-soft [&_a]:text-accent"
        dangerouslySetInnerHTML={{ __html: tr.bodyHtml }}
      />
    </article>
  );
}
