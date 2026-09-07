import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { buildMetadata, toDescription } from "@/lib/seo";
import { jsonLdScript, newsArticleLd } from "@/lib/json-ld";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const revalidate = 3600;

function articleFor(slug: string, locale: string) {
  return db.newsArticle.findUnique({
    where: { slug },
    include: {
      translations: { where: { locale: locale === "ar" ? "ar" : "en" } },
      gallery: { orderBy: { id: "asc" } },
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
  const tn = await getTranslations("nav");

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
      <Breadcrumbs
        locale={locale}
        trail={[
          { name: tn("home"), path: "/" },
          { name: tn("news"), path: "/news" },
          { name: tr.title, path: `/news/${slug}` },
        ]}
      />
      {article.publishedAt ? (
        <time className="text-xs font-medium uppercase tracking-wide text-ink-faint">
          {new Date(article.publishedAt).toLocaleDateString(locale)}
        </time>
      ) : null}
      <h1 className="mt-2 font-display font-semibold text-5xl leading-tight text-ink">
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

      {/* Extra photos, below the article body. Each carries its own caption,
          written by the editor, which doubles as the alt text — an author
          describing "signing the MoU" writes a better description than any
          fallback could, and asking for the same sentence twice guarantees
          one of the two goes stale. */}
      {article.gallery.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-ink">{tn("gallery")}</h2>
          <div className="stagger mt-4 grid gap-4 sm:grid-cols-2">
            {article.gallery.map((item) => (
              <figure key={item.id}>
                <div className="zoom-frame relative aspect-[4/3] overflow-hidden rounded-2xl border border-rule bg-surface-2">
                  <Image
                    src={item.imageUrl}
                    alt={item.caption ?? ""}
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                {item.caption ? (
                  <figcaption className="mt-2 text-sm leading-relaxed text-ink-faint">
                    {item.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
