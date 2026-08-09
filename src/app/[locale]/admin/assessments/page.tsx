import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";

export default async function AdminAssessmentsPage() {
  const sessions = await db.assessmentSession.findMany({
    where: { status: "SCORED" },
    orderBy: { submittedAt: "desc" },
    include: { restaurant: true },
  });
  const tn = await getTranslations("admin.nav");
  const ta = await getTranslations("admin.assessments");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">
        {tn("selfAssessments")}
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">{ta("description")}</p>

      <div className="mt-6 divide-y divide-rule rounded-2xl border border-rule bg-surface">
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
                <span className="flex items-center gap-1 rounded-full bg-brass-soft px-2.5 py-1 text-xs font-semibold text-brass">
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
