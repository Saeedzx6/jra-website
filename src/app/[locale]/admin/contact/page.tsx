import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { markInquiryHandled } from "@/lib/actions/admin";

export default async function AdminContactPage() {
  const inquiries = await db.contactInquiry.findMany({ orderBy: { createdAt: "desc" } });
  const tn = await getTranslations("admin.nav");
  const tc = await getTranslations("admin.contact");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tn("contactInbox")}</h1>
      <div className="mt-6 space-y-3">
        {inquiries.map((inq) => (
          <div key={inq.id} className="rounded-2xl border border-rule bg-surface p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-ink">
                  {inq.subject} — <span className="text-ink-soft">{inq.name}</span>
                </p>
                <p className="mt-1 text-sm text-ink-soft">{inq.message}</p>
                <p className="mt-1 text-xs text-ink-faint">{inq.email}</p>
              </div>
              {inq.status === "NEW" ? (
                <form action={markInquiryHandled.bind(null, inq.id)}>
                  <button suppressHydrationWarning className="shrink-0 rounded-full border border-accent px-4 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-white">
                    {tc("markHandled")}
                  </button>
                </form>
              ) : (
                <span className="shrink-0 rounded-full bg-olive-soft px-3 py-1 text-xs font-medium text-olive-text">
                  {tc("handled")}
                </span>
              )}
            </div>
          </div>
        ))}
        {inquiries.length === 0 && <p className="text-ink-soft">{tc("noInquiriesYet")}</p>}
      </div>
    </div>
  );
}
