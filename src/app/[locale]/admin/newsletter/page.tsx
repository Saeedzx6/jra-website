import { Download } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";

export default async function AdminNewsletterPage() {
  const subscribers = await db.newsletterSubscriber.findMany({
    where: { status: "SUBSCRIBED" },
    orderBy: { createdAt: "desc" },
  });

  const tn = await getTranslations("admin.nav");
  const ta = await getTranslations("admin.common");
  const tnl = await getTranslations("admin.newsletter");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">{tn("newsletterSubscribers")}</h1>
        <a
          href="/api/admin/newsletter/export"
          className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          <Download className="h-4 w-4" /> {ta("exportCsv")}
        </a>
      </div>
      <p className="mt-2 text-sm text-ink-soft">{tnl("activeSubscribers", { count: subscribers.length })}</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-rule bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3 text-start">{tnl("email")}</th>
              <th className="px-4 py-3 text-start">{tnl("interests")}</th>
              <th className="px-4 py-3 text-start">{tnl("locale")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {subscribers.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 text-ink">{s.email}</td>
                <td className="px-4 py-3 text-ink-soft">{s.interests.join(", ") || "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{s.localePref}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
