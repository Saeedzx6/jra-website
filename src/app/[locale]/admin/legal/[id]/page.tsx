import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/admin/form-controls";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { addLegalDocumentVersion } from "@/lib/actions/legal";
import { cx, ui } from "@/lib/ui";

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
      <h1 className={ui.sectionTitle}>{doc.topic ?? doc.slug}</h1>

      <div className="mt-6 space-y-2">
        {doc.versions.map((v) => (
          <div key={v.id} className="rounded-lg border border-rule bg-surface p-3 text-sm text-ink">
            v{v.versionLabel} {v.fileUrl ? `— ${v.fileUrl}` : ""}
          </div>
        ))}
      </div>

      <form action={action} className={cx("mt-6 space-y-3", ui.panel)}>
        <h2 className="font-medium text-ink">{tl("addNewVersion")}</h2>
        <input name="versionLabel" required placeholder={tl("versionLabelOnly")} className={cx("w-full", ui.field)} />
        <input name="fileUrl" placeholder={tl("fileUrlOnly")} className={cx("w-full", ui.field)} />
        <textarea name="bodyHtml" rows={3} placeholder={tl("amendmentSummaryPlaceholder")} className={cx("w-full", ui.field)} />
        <SubmitButton>{tl("addVersion")}</SubmitButton>
      </form>
    </div>
  );
}
