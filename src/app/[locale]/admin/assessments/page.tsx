import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { ui } from "@/lib/ui";
import { ReRatingQueue } from "@/components/admin/re-rating-queue";

export default async function AdminAssessmentsPage() {
  // Two queues, because they are two different decisions. A SCORED session is
  // a finished assessment awaiting a grade; a REQUESTED one is an
  // establishment asking to be rated again, and nothing has been filled in yet.
  const [sessions, reRatings] = await Promise.all([
    db.assessmentSession.findMany({
      where: { status: "SCORED" },
      orderBy: { submittedAt: "desc" },
      include: { restaurant: true },
    }),
    db.assessmentSession.findMany({
      where: { status: "REQUESTED" },
      orderBy: { createdAt: "asc" },
      include: { restaurant: true },
    }),
  ]);
  const tn = await getTranslations("admin.nav");
  const ta = await getTranslations("admin.assessments");

  return (
    <div>
      <h1 className={ui.sectionTitle}>
        {tn("selfAssessments")}
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">{ta("description")}</p>

      <section className="mt-8">
        <h2 className="font-medium text-ink">
          {ta("reRating.heading")}
          {reRatings.length > 0 ? (
            <span className="ms-2 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
              {reRatings.length}
            </span>
          ) : null}
        </h2>
        <p className="mt-1 max-w-xl text-xs text-ink-faint">{ta("reRating.intro")}</p>
        <ReRatingQueue
          requests={reRatings.map((r) => ({
            id: r.id,
            restaurantName: r.restaurant.name,
            reason: r.requestedReason,
            requestedAt: r.createdAt.toISOString(),
            cycle: r.cycle,
          }))}
        />
      </section>

      <h2 className="mt-10 font-medium text-ink">{ta("submittedHeading")}</h2>

      <div className="mt-4 divide-y divide-rule rounded-2xl border border-rule bg-surface">
        {sessions.map((s) => (
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
        {sessions.length === 0 && (
          <p className="p-5 text-ink-soft">{ta("noSubmittedYet")}</p>
        )}
      </div>
    </div>
  );
}
