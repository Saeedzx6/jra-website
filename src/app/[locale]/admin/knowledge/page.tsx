import { getTranslations } from "next-intl/server";
import { SubmitButton } from "@/components/admin/form-controls";
import { db } from "@/lib/db";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { createResource } from "@/lib/actions/resources";
import { cx, ui } from "@/lib/ui";

const TYPE_KEYS = ["STUDY", "GUIDE", "TEMPLATE", "PROJECT", "OPPORTUNITY", "CASE_STUDY"] as const;

export default async function AdminKnowledgePage() {
  const resources = await db.resource.findMany({
    where: { type: { in: ["STUDY", "GUIDE", "TEMPLATE", "PROJECT", "OPPORTUNITY", "CASE_STUDY"] } },
    include: { translations: { where: { locale: "en" } } },
    orderBy: { createdAt: "desc" },
  });

  const ta = await getTranslations("admin.common");
  const tk = await getTranslations("admin.knowledge");
  const tType = await getTranslations("resourceTypes");
  const tmedia = await getTranslations("admin.media");

  return (
    <div>
      <h1 className={ui.sectionTitle}>{tk("title")}</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">{tk("description")}</p>

      <details className={cx("mt-6", ui.panel)}>
        <summary className="cursor-pointer font-medium text-ink">{tk("newEntry")}</summary>
        <form action={createResource} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="title" required placeholder={ta("titlePlaceholder")} className={ui.field} />
            <select name="type" required className={ui.field}>
              {TYPE_KEYS.map((k) => (
                <option key={k} value={k}>{tType(k)}</option>
              ))}
            </select>
            <input name="fileUrl" placeholder={tk("fileUrlPlaceholder")} className={ui.field} />
            <input name="deadlineAt" type="date" placeholder={tk("deadlinePlaceholder")} className={ui.field} />
          </div>
          <textarea name="summary" rows={3} placeholder={tk("summaryPlaceholder")} className={cx("w-full", ui.field)} />
          <SubmitButton>{ta("create")}</SubmitButton>
        </form>
      </details>

      <div className="mt-6 divide-y divide-rule rounded-2xl border border-rule bg-surface">
        {resources.map((r) => (
          <div key={r.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-ink">
                {r.translations[0]?.title ?? r.slug}
              </span>
              <span className="shrink-0 rounded-full bg-brass-soft px-2.5 py-0.5 text-xs font-medium text-brass-text">
                {tType(r.type)}
              </span>
            </div>
            <div className="mt-3">
              <CoverImageField
                target="resource"
                id={r.id}
                currentUrl={r.coverImageUrl}
                label={tmedia("coverImage")}
                hint={tmedia("coverHintPortrait")}
              />
            </div>
          </div>
        ))}
        {resources.length === 0 && <p className="p-4 text-ink-soft">{tk("noEntriesYet")}</p>}
      </div>
    </div>
  );
}
