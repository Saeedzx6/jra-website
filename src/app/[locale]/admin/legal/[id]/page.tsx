import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { addLegalDocumentVersion } from "@/lib/actions/legal";

export default async function AdminLegalDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await db.legalDocument.findUnique({
    where: { id },
    include: { versions: { orderBy: { publishedAt: "desc" } } },
  });
  if (!doc) notFound();

  const tl = await getTranslations("admin.legal");
  const action = addLegalDocumentVersion.bind(null, id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{doc.topic ?? doc.slug}</h1>

      <div className="mt-6 space-y-2">
        {doc.versions.map((v) => (
          <div key={v.id} className="rounded-lg border border-rule bg-surface p-3 text-sm text-ink">
            v{v.versionLabel} {v.fileUrl ? `— ${v.fileUrl}` : ""}
          </div>
        ))}
      </div>

      <form action={action} className="mt-6 space-y-3 rounded-2xl border border-rule bg-surface p-5">
        <h2 className="font-medium text-ink">{tl("addNewVersion")}</h2>
        <input suppressHydrationWarning name="versionLabel" required placeholder={tl("versionLabelOnly")} className="w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
        <input suppressHydrationWarning name="fileUrl" placeholder={tl("fileUrlOnly")} className="w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
        <textarea suppressHydrationWarning name="bodyHtml" rows={3} placeholder={tl("amendmentSummaryPlaceholder")} className="w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
        <button suppressHydrationWarning className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white">{tl("addVersion")}</button>
      </form>
    </div>
  );
}
