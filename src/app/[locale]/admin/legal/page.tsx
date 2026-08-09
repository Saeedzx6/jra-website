import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { createLegalDocument } from "@/lib/actions/legal";

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
      <h1 className="font-display text-2xl font-semibold text-ink">{tn("legalDocuments")}</h1>

      <details className="mt-6 rounded-2xl border border-rule bg-surface p-5">
        <summary className="cursor-pointer font-medium text-ink">{tl("newDocument")}</summary>
        <form action={createLegalDocument} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input suppressHydrationWarning name="title" required placeholder={tl("titlePlaceholder")} className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
            <select suppressHydrationWarning name="type" required className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm">
              <option value="LAW">{tType("LAW")}</option>
              <option value="REGULATION">{tType("REGULATION")}</option>
              <option value="INSTRUCTION">{tType("INSTRUCTION")}</option>
            </select>
            <input suppressHydrationWarning name="topic" placeholder={tl("topicPlaceholder")} className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
            <input suppressHydrationWarning name="entity" placeholder={tl("entityPlaceholder")} className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
            <input suppressHydrationWarning name="year" type="number" placeholder={tl("yearPlaceholder")} className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
            <input suppressHydrationWarning name="versionLabel" placeholder={tl("versionLabelPlaceholder")} defaultValue="1.0" className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
          </div>
          <input suppressHydrationWarning name="fileUrl" placeholder={tl("fileUrlPlaceholder")} className="w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
          <textarea suppressHydrationWarning name="bodyHtml" rows={3} placeholder={tl("summaryPlaceholder")} className="w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
          <button suppressHydrationWarning className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white">{ta("create")}</button>
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
