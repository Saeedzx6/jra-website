import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { ChangeRequestRow } from "@/components/admin/change-request-row";

export default async function AdminChangeRequestsPage() {
  const requests = await db.changeRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { submittedBy: true },
  });
  const tn = await getTranslations("admin.nav");
  const tcr = await getTranslations("admin.changeRequests");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tn("changeRequests")}</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">{tcr("description")}</p>
      <div className="mt-6 space-y-3">
        {requests.map((r) => (
          <ChangeRequestRow
            key={r.id}
            id={r.id}
            entityType={r.entityType}
            action={r.action}
            payload={r.payload as Record<string, unknown>}
            submittedByName={r.submittedBy.fullName}
          />
        ))}
        {requests.length === 0 && <p className="text-ink-soft">{tcr("noPending")}</p>}
      </div>
    </div>
  );
}
