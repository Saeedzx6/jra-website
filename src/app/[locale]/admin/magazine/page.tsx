import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { createMagazineArticle } from "@/lib/actions/magazine";

export default async function AdminMagazinePage() {
  const issues = await db.magazineIssue.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { articles: { include: { translations: { where: { locale: "en" } } } } },
  });

  const tn = await getTranslations("admin.nav");
  const ta = await getTranslations("admin.common");
  const tm = await getTranslations("admin.magazine");
  const tMag = await getTranslations("magazine");
  const tAccess = await getTranslations("admin.magazine.accessLevelOptions");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tn("magazineArticles")}</h1>

      <div className="mt-6 space-y-6">
        {issues.map((issue) => {
          const action = createMagazineArticle.bind(null, issue.id);
          return (
            <div key={issue.id} className="rounded-2xl border border-rule bg-surface p-5">
              <h2 className="font-display text-lg font-semibold text-ink">
                {tMag("issue", { number: issue.issueNumber })} — {issue.month}/{issue.year}
              </h2>

              <ul className="mt-3 space-y-1">
                {issue.articles.map((a) => (
                  <li key={a.id} className="text-sm text-ink-soft">
                    {a.translations[0]?.title ?? a.slug} —{" "}
                    <span className="text-xs text-ink-faint">{a.accessLevel}</span>
                  </li>
                ))}
                {issue.articles.length === 0 && (
                  <li className="text-sm text-ink-faint">{tm("noArticlesYet")}</li>
                )}
              </ul>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-accent">
                  {tm("addArticle")}
                </summary>
                <form action={action} className="mt-3 space-y-2">
                  <input suppressHydrationWarning name="title" required placeholder={tm("articleTitlePlaceholder")} className="w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input suppressHydrationWarning name="category" placeholder={tm("categoryPlaceholder")} className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm" />
                    <select suppressHydrationWarning name="accessLevel" className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm">
                      <option value="PUBLIC">{tAccess("PUBLIC")}</option>
                      <option value="MEMBERS_ONLY">{tAccess("MEMBERS_ONLY")}</option>
                    </select>
                  </div>
                  <textarea suppressHydrationWarning name="bodyHtml" required rows={3} placeholder={ta("bodyHtmlPlaceholder")} className="w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm" />
                  <button suppressHydrationWarning className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white">
                    {ta("add")}
                  </button>
                </form>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
