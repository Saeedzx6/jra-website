import { RefreshCw, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";

/**
 * Two queues, not one.
 *
 * A re-rating request and a finished submission both need JRA to act, but
 * they are different actions — one opens a cycle, the other awards a grade —
 * and a request left sitting in a list of submissions reads as something
 * already scored. Requests come first because an establishment asking for one
 * is blocked until someone answers.
 */
export default async function AdminAssessmentsPage() {
  const [requests, submissions] = await Promise.all([
    db.assessmentSession.findMany({
      where: { status: "REQUESTED" },
      orderBy: { createdAt: "asc" },
      include: { restaurant: true },
    }),
    db.assessmentSession.findMany({
      where: { status: "SCORED" },
      orderBy: { submittedAt: "desc" },
      include: { restaurant: true },
    }),
  ]);

  const tn = await getTranslations("admin.nav");
  const ta = await getTranslations("admin.assessments");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tn("selfAssessments")}</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">{ta("description")}</p>

      {requests.length > 0 ? (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
            {ta("reRatingQueue", { count: requests.length })}
          </h2>
          <div className="mt-3 divide-y divide-rule rounded-2xl border border-accent/40 bg-accent-soft/30">
            {requests.map((s) => (
              <Link
                key={s.id}
                href={`/admin/assessments/${s.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface/60"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{s.restaurant.name}</p>
                  <p className="truncate text-xs text-ink-faint">
                    {ta("cycleLabel", { cycle: s.cycle })}
                    {s.requestedReason ? ` · ${s.requestedReason}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                  {ta("review")}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">
          {ta("submissionQueue", { count: submissions.length })}
        </h2>
        <div className="mt-3 divide-y divide-rule rounded-2xl border border-rule bg-surface">
          {submissions.map((s) => (
            <Link
              key={s.id}
              href={`/admin/assessments/${s.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-surface-2/40"
            >
              <div>
                <p className="text-sm font-medium text-ink">{s.restaurant.name}</p>
                <p className="text-xs text-ink-faint">
                  {s.establishmentType} ·{" "}
                  {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "—"}
                  {s.cycle > 1 ? ` · ${ta("cycleLabel", { cycle: s.cycle })}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular text-sm text-ink-soft">
                  {s.totalScore !== null ? Math.round(s.totalScore) : "—"} {ta("pts")}
                </span>
                {s.resultingStars ? (
                  <span className="flex items-center gap-1 rounded-full bg-brass-soft px-2.5 py-1 text-xs font-semibold text-brass-text">
                    <Star className="h-3 w-3 fill-brass" />
                    {s.resultingStars}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
          {submissions.length === 0 && <p className="p-5 text-ink-soft">{ta("noSubmittedYet")}</p>}
        </div>
      </section>
    </div>
  );
}
