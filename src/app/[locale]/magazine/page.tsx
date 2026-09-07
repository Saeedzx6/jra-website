import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { CoverThumb } from "@/components/cover-thumb";
import { pageMetadata } from "@/lib/page-metadata";

// Cached and revalidated every 3600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 3600;

export const generateMetadata = pageMetadata("/magazine", "magazine");

export default async function MagazinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tm = await getTranslations("magazine");

  const issues = await db.magazineIssue.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl text-ink">{t("magazine")}</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">{tm("description")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {issues.map((issue) => (
          <Link
            key={issue.id}
            href={`/magazine/${issue.id}`}
            className="motion-card group overflow-hidden rounded-2xl border border-rule bg-surface text-center"
          >
            <CoverThumb
              url={issue.coverImageUrl}
              alt=""
              seed={issue.id}
              title={String(issue.issueNumber ?? issue.year)}
              sizes="(min-width: 640px) 33vw, 100vw"
              aspect="aspect-[3/4]"
            />
            <p className="mt-4 font-display text-lg text-ink">
              {tm("issue", { number: issue.issueNumber })}
            </p>
            <p className="text-sm text-ink-faint">
              {issue.month}/{issue.year}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
