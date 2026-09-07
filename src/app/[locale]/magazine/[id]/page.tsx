import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock, FileText } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getSession } from "@/lib/rbac";

// Cached and revalidated every 3600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const tm = await getTranslations({ locale, namespace: "magazine" });

  const issue = await db.magazineIssue.findUnique({
    where: { id },
    select: { issueNumber: true, month: true, year: true, coverImageUrl: true },
  });
  if (!issue) {
    return buildMetadata({
      locale,
      path: `/magazine/${id}`,
      title: t("magazineTitle"),
      description: t("magazineDescription"),
      noIndex: true,
    });
  }

  // issueNumber is nullable on the model, so the month/year is the part that
  // can always distinguish one issue's title from another's.
  const period = `${issue.month}/${issue.year}`;
  const title =
    issue.issueNumber != null
      ? `${tm("issue", { number: issue.issueNumber })} — ${period}`
      : `${t("magazineTitle")} — ${period}`;

  return buildMetadata({
    locale,
    path: `/magazine/${id}`,
    title,
    description: t("magazineDescription"),
    image: issue.coverImageUrl,
  });
}

export default async function MagazineIssuePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const tm = await getTranslations("magazine");
  const tn = await getTranslations("nav");
  const issue = await db.magazineIssue.findUnique({
    where: { id },
    include: {
      articles: {
        orderBy: { sortOrder: "asc" },
        include: { translations: { where: { locale: locale === "ar" ? "ar" : "en" } } },
      },
    },
  });
  if (!issue) notFound();

  const session = await getSession();
  const isMember = Boolean(session?.user);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        locale={locale}
        trail={[
          { name: tn("home"), path: "/" },
          { name: tn("magazine"), path: "/magazine" },
          { name: `${issue.month}/${issue.year}`, path: `/magazine/${id}` },
        ]}
      />
      <h1 className="font-display text-3xl font-semibold text-ink">
        {tm("issue", { number: issue.issueNumber })} — {issue.month}/{issue.year}
      </h1>
      {issue.pdfUrl ? (
        <a href={issue.pdfUrl} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
          <FileText className="h-4 w-4" /> {tm("downloadFullPdf")}
        </a>
      ) : null}

      <div className="mt-8 space-y-6">
        {issue.articles.map((a) => {
          const tr = a.translations[0];
          const locked = a.accessLevel === "MEMBERS_ONLY" && !isMember;
          return (
            <article key={a.id} className="rounded-2xl border border-rule bg-surface p-6">
              {a.category ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-warning-text">
                  {a.category}
                </span>
              ) : null}
              <h2 className="mt-1 font-display text-lg font-semibold text-ink">
                {tr?.title ?? a.slug}
              </h2>
              {locked ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-2 p-4 text-sm text-ink-faint">
                  <Lock className="h-4 w-4" />
                  {tm("membersOnlyNote")}
                </div>
              ) : (
                <div
                  className="prose mt-3 max-w-none text-sm text-ink-soft"
                  dangerouslySetInnerHTML={{ __html: tr?.bodyHtml ?? "" }}
                />
              )}
            </article>
          );
        })}
        {issue.articles.length === 0 && (
          <p className="text-ink-soft">{tm("noArticlesYet")}</p>
        )}
      </div>
    </div>
  );
}
