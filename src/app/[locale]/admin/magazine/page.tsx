import { getTranslations } from "next-intl/server";
import { SubmitButton } from "@/components/admin/form-controls";
import { db } from "@/lib/db";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { createMagazineArticle, createMagazineIssue } from "@/lib/actions/magazine";
import { cx, ui } from "@/lib/ui";

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
  const tmedia = await getTranslations("admin.media");
  const tIssue = await getTranslations("admin.magazineIssues");

  return (
    <div>
      <h1 className={ui.sectionTitle}>{tn("magazineArticles")}</h1>

      <details className={cx("mt-6", ui.panel)}>
        <summary className="cursor-pointer font-medium text-ink">{tIssue("newIssue")}</summary>
        <form action={createMagazineIssue} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            name="issueNumber"
            type="number"
            min={1}
            placeholder={tIssue("issueNumber")}
            className={cx("w-full", ui.field)}
          />
          <input
            name="month"
            type="number"
            min={1}
            max={12}
            required
            placeholder={tIssue("month")}
            className={cx("w-full", ui.field)}
          />
          <input
            name="year"
            type="number"
            min={2000}
            max={2100}
            required
            defaultValue={new Date().getFullYear()}
            placeholder={tIssue("year")}
            className={cx("w-full", ui.field)}
          />
          <div className="sm:col-span-3">
            <button
              className="pill-press rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
            >
              {ta("create")}
            </button>
          </div>
        </form>
      </details>

      <div className="mt-6 space-y-6">
        {issues.map((issue) => {
          const action = createMagazineArticle.bind(null, issue.id);
          return (
            <div key={issue.id} className={ui.panel}>
              <h2 className="font-display text-lg font-semibold text-ink">
                {tMag("issue", { number: issue.issueNumber })} — {issue.month}/{issue.year}
              </h2>

              <div className="mt-3">
                <CoverImageField
                  target="magazineIssue"
                  id={issue.id}
                  currentUrl={issue.coverImageUrl}
                  label={tmedia("coverImage")}
                  hint={tmedia("coverHintPortrait")}
                />
              </div>

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
                  <input name="title" required placeholder={tm("articleTitlePlaceholder")} className="w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input name="category" placeholder={tm("categoryPlaceholder")} className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm" />
                    <select name="accessLevel" className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm">
                      <option value="PUBLIC">{tAccess("PUBLIC")}</option>
                      <option value="MEMBERS_ONLY">{tAccess("MEMBERS_ONLY")}</option>
                    </select>
                  </div>
                  <textarea name="bodyHtml" required rows={3} placeholder={ta("bodyHtmlPlaceholder")} className="w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm" />
                  <SubmitButton>{ta("add")}</SubmitButton>
                </form>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
