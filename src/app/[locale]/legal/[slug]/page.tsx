import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";

// Cached and revalidated every 3600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const tType = await getTranslations({ locale, namespace: "legalTypes" });

  const doc = await db.legalDocument.findUnique({
    where: { slug },
    select: { topic: true, type: true, year: true },
  });
  if (!doc) {
    return buildMetadata({
      locale,
      path: `/legal/${slug}`,
      title: t("legalTitle"),
      description: t("legalDescription"),
      noIndex: true,
    });
  }

  const title = [doc.topic ?? tType(doc.type), doc.year].filter(Boolean).join(" · ");

  return buildMetadata({
    locale,
    path: `/legal/${slug}`,
    title,
    // Distinct per document rather than reusing the section description: the
    // type and year are the only facts guaranteed present on every record.
    description: `${tType(doc.type)}${doc.year ? ` (${doc.year})` : ""} — ${t("legalDescription")}`,
  });
}

export default async function LegalDocumentPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const tl = await getTranslations("legal");
  const tType = await getTranslations("legalTypes");
  const tn = await getTranslations("nav");
  const doc = await db.legalDocument.findUnique({
    where: { slug },
    include: { versions: { orderBy: { publishedAt: "desc" } } },
  });
  if (!doc) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        locale={locale}
        trail={[
          { name: tn("home"), path: "/" },
          { name: tn("legal"), path: "/legal" },
          { name: doc.topic ?? tType(doc.type), path: `/legal/${slug}` },
        ]}
      />
      <span className="text-xs font-semibold uppercase tracking-wide text-warning-text">
        {tType(doc.type)} {doc.year ? `· ${doc.year}` : ""}
      </span>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
        {doc.topic ?? doc.slug}
      </h1>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">{tl("versionHistory")}</h2>
      <div className="mt-4 space-y-3">
        {doc.versions.map((v) => (
          <div key={v.id} className="rounded-xl border border-rule bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink">v{v.versionLabel}</span>
              {v.publishedAt ? (
                <span className="text-xs text-ink-faint">
                  {new Date(v.publishedAt).toLocaleDateString(locale)}
                </span>
              ) : null}
            </div>
            {v.bodyHtml ? (
              <div
                className="prose mt-2 max-w-none text-sm text-ink-soft"
                dangerouslySetInnerHTML={{ __html: v.bodyHtml }}
              />
            ) : null}
            {v.fileUrl ? (
              <a href={v.fileUrl} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                <FileText className="h-4 w-4" /> {tl("downloadDocument")}
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
