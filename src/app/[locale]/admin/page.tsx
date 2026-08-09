import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";

export default async function AdminDashboard() {
  const td = await getTranslations("admin.dashboard");
  const [restaurants, published, draft, news, contacts, applications, changeRequests, assessments] =
    await Promise.all([
      db.restaurant.count(),
      db.restaurant.count({ where: { status: "PUBLISHED" } }),
      db.restaurant.count({ where: { status: "DRAFT" } }),
      db.newsArticle.count(),
      db.contactInquiry.count({ where: { status: "NEW" } }),
      db.membershipApplication.count({ where: { status: "PENDING" } }),
      db.changeRequest.count({ where: { status: "PENDING" } }),
      db.assessmentSession.count({ where: { status: "SCORED" } }),
    ]);

  const stats = [
    { label: td("restaurants"), value: restaurants, sub: td("publishedDraft", { published, draft }) },
    { label: td("newsArticles"), value: news },
    { label: td("newContactInquiries"), value: contacts },
    { label: td("pendingMembershipApplications"), value: applications },
    { label: td("pendingChangeRequests"), value: changeRequests },
    { label: td("submittedSelfAssessments"), value: assessments },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{td("title")}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-rule bg-surface p-5">
            <div className="tabular font-display text-3xl font-semibold text-accent">
              {s.value}
            </div>
            <div className="mt-1 text-sm text-ink-soft">{s.label}</div>
            {s.sub ? <div className="mt-0.5 text-xs text-ink-faint">{s.sub}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
