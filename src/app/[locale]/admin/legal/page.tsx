import { getTranslations } from "next-intl/server";
import { SubmitButton } from "@/components/admin/form-controls";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { createLegalDocument } from "@/lib/actions/legal";
import { cx, ui } from "@/lib/ui";

export default async function AdminLegalPage() {
  const documents = await db.legalDocument.findMany({
    orderBy: { year: "desc" },
    include: { versions: true },
  });

  const tn = await getTranslations("admin.nav");
  const ta = await getTranslations("admin.common");
  const tl = await getTranslations("admin.legal");
  const tType = await getTranslations("legalTypes");

  return (
    <div>
      <h1 className={ui.sectionTitle}>{tn("legalDocuments")}</h1>

      <details className={cx("mt-6", ui.panel)}>
        <summary className="cursor-pointer font-medium text-ink">{tl("newDocument")}</summary>
        <form action={createLegalDocument} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="title" required placeholder={tl("titlePlaceholder")} className={ui.field} />
            <select name="type" required className={ui.field}>
              <option value="LAW">{tType("LAW")}</option>
              <option value="REGULATION">{tType("REGULATION")}</option>
              <option value="INSTRUCTION">{tType("INSTRUCTION")}</option>
            </select>
            <input name="topic" placeholder={tl("topicPlaceholder")} className={ui.field} />
            <input name="entity" placeholder={tl("entityPlaceholder")} className={ui.field} />
            <input name="year" type="number" placeholder={tl("yearPlaceholder")} className={ui.field} />
            <input name="versionLabel" placeholder={tl("versionLabelPlaceholder")} defaultValue="1.0" className={ui.field} />
          </div>
          <input name="fileUrl" placeholder={tl("fileUrlPlaceholder")} className={cx("w-full", ui.field)} />
          <textarea name="bodyHtml" rows={3} placeholder={tl("summaryPlaceholder")} className={cx("w-full", ui.field)} />
          <SubmitButton>{ta("create")}</SubmitButton>
        </form>
      </details>

      <div className="mt-6 divide-y divide-rule rounded-2xl border border-rule bg-surface">
        {documents.map((d) => (
          <div key={d.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-ink">
              {d.topic ?? d.slug} ({tType(d.type)}) — {tl("versionsCount", { count: d.versions.length })}
            </span>
            <Link href={`/admin/legal/${d.id}`} className="text-sm text-accent hover:underline">
              {ta("manage")}
            </Link>
          </div>
        ))}
        {documents.length === 0 && <p className="p-4 text-ink-soft">{tl("noDocumentsYet")}</p>}
      </div>
    </div>
  );
}
