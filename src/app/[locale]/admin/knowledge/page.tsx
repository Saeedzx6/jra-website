import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { createResource } from "@/lib/actions/resources";

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

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tk("title")}</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">{tk("description")}</p>

      <details className="mt-6 rounded-2xl border border-rule bg-surface p-5">
        <summary className="cursor-pointer font-medium text-ink">{tk("newEntry")}</summary>
        <form action={createResource} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input suppressHydrationWarning name="title" required placeholder={ta("titlePlaceholder")} className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
            <select suppressHydrationWarning name="type" required className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm">
              {TYPE_KEYS.map((k) => (
                <option key={k} value={k}>{tType(k)}</option>
              ))}
            </select>
            <input suppressHydrationWarning name="fileUrl" placeholder={tk("fileUrlPlaceholder")} className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
            <input suppressHydrationWarning name="deadlineAt" type="date" placeholder={tk("deadlinePlaceholder")} className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
          </div>
          <textarea suppressHydrationWarning name="summary" rows={3} placeholder={tk("summaryPlaceholder")} className="w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
          <button suppressHydrationWarning className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white">{ta("create")}</button>
        </form>
      </details>

      <div className="mt-6 divide-y divide-rule rounded-2xl border border-rule bg-surface">
        {resources.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-ink">
              {r.translations[0]?.title ?? r.slug}
            </span>
            <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning-text">
              {tType(r.type)}
            </span>
          </div>
        ))}
        {resources.length === 0 && <p className="p-4 text-ink-soft">{tk("noEntriesYet")}</p>}
      </div>
    </div>
  );
}
