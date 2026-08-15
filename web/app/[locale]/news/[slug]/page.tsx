import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getFormatter,
  getLocale,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import { PageHero } from "@/components/layout/PageHero";
import { news, pick } from "@/lib/content";
import { routing, type Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    news.map((article) => ({ locale, slug: article.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = news.find((a) => a.slug === slug);
  if (!article) return {};
  return {
    title: pick(article.title, locale as Locale),
    description: pick(article.body, locale as Locale),
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = news.find((a) => a.slug === slug);
  if (!article) notFound();

  const activeLocale = (await getLocale()) as Locale;
  const t = await getTranslations("nav");
  const format = await getFormatter();

  return (
    <>
      <PageHero
        eyebrow={pick(article.kicker, activeLocale)}
        title={pick(article.title, activeLocale)}
        crumbs={[
          { label: "JRA", href: "/" },
          { label: t("mediaCenter"), href: "/news" },
          { label: pick(article.title, activeLocale) },
        ]}
      />

      <article className="section">
        <div className="wrap">
          <div style={{ maxInlineSize: "68ch", display: "grid", gap: "1.5rem" }}>
            <p style={{ color: "var(--ink-soft)", fontWeight: 700 }}>
              <time dateTime={article.date}>
                {format.dateTime(new Date(article.date), {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </p>

            <div className="media" style={{ borderRadius: "var(--r-lg)", aspectRatio: "16 / 9" }}>
              <Image
                src={article.image}
                alt=""
                width={1200}
                height={675}
                sizes="(min-width: 900px) 68ch, 100vw"
              />
            </div>

            <p style={{ fontSize: "1.0625rem" }}>{pick(article.body, activeLocale)}</p>
          </div>
        </div>
      </article>
    </>
  );
}
