import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { membershipHealth } from "@/lib/membership";
import { revenueSummary, formatMoney } from "@/lib/billing";

export default async function AdminDashboard() {
  const td = await getTranslations("admin.dashboard");
  const tm = await getTranslations("membershipHealth");
  const trv = await getTranslations("revenue");
  const [health, revenue] = await Promise.all([membershipHealth(), revenueSummary()]);
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

  // Standing is a state, not just a number, so each tile carries its own
  // semantic colour and a text label — colour alone would fail WCAG 1.4.1.
  const standings = [
    { label: tm("good"), value: health.good, tone: "text-success-text", dot: "bg-success" },
    { label: tm("grace"), value: health.grace, tone: "text-warning-text", dot: "bg-warning" },
    { label: tm("lapsed"), value: health.lapsed, tone: "text-danger-text", dot: "bg-danger" },
    { label: tm("suspended"), value: health.suspended, tone: "text-ink-soft", dot: "bg-ink-faint" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{td("title")}</h1>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {tm("title")}
        </h2>
        {health.total === 0 ? (
          <p className="mt-3 rounded-2xl border border-rule bg-surface p-5 text-sm text-ink-soft">
            {tm("empty")}
          </p>
        ) : (
          <>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {standings.map((s) => (
                <div key={s.label} className="rounded-2xl border border-rule bg-surface p-5">
                  <div className={`tabular font-display text-3xl font-semibold ${s.tone}`}>
                    {s.value}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-ink-soft">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} aria-hidden="true" />
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            {health.expiringSoon > 0 ? (
              <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-sm font-medium text-warning-text">
                {health.expiringSoon} · {tm("expiringSoon")}
              </p>
            ) : null}
          </>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {trv("title")}
        </h2>
        {revenue.count === 0 ? (
          <p className="mt-3 rounded-2xl border border-rule bg-surface p-5 text-sm text-ink-soft">
            {trv("empty")}
          </p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: trv("invoiced"), value: revenue.invoiced, tone: "text-ink" },
              { label: trv("collected"), value: revenue.collected, tone: "text-success-text" },
              { label: trv("outstanding"), value: revenue.outstanding, tone: "text-ink-soft" },
              { label: trv("overdue"), value: revenue.overdue, tone: "text-danger-text" },
            ].map((r) => (
              <div key={r.label} className="rounded-2xl border border-rule bg-surface p-5">
                {/* Tabular figures so the columns line up rather than jittering. */}
                <div className={`tabular font-display text-xl font-semibold ${r.tone}`}>
                  {formatMoney(r.value)}
                </div>
                <div className="mt-1 text-sm text-ink-soft">{r.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
