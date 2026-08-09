import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";

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
      <h1 className="font-display text-3xl font-semibold text-ink">{t("magazine")}</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">{tm("description")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {issues.map((issue) => (
          <Link
            key={issue.id}
            href={`/magazine/${issue.id}`}
            className="motion-card rounded-2xl border border-rule bg-surface p-6 text-center"
          >
            <BookOpen className="mx-auto h-8 w-8 text-accent" />
            <p className="mt-3 font-display text-lg font-semibold text-ink">
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
