import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getStandardWithCriteria } from "@/lib/classification";

export default async function AdminAssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await db.assessmentSession.findUnique({
    where: { id },
    include: { restaurant: true, answers: true },
  });
  if (!session) notFound();

  const standard = await getStandardWithCriteria(session.establishmentType);
  if (!standard) notFound();

  const ta = await getTranslations("admin.assessments");
  const tStatus = await getTranslations("admin.assessments.statusLabels");

  const answersByCriterion = new Map(session.answers.map((a) => [a.criterionId, a]));

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-brass-text">
        {session.establishmentType}
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
        {session.restaurant.name}
      </h1>
      <div className="mt-2 flex items-center gap-4">
        <span className="tabular text-sm text-ink-soft">
          {session.totalScore !== null ? Math.round(session.totalScore) : "—"} /{" "}
          {standard.totalPossiblePoints} {ta("points")}
        </span>
        {session.resultingStars ? (
          <span className="flex items-center gap-1 text-brass-text">
            {Array.from({ length: session.resultingStars }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-brass" />
            ))}
          </span>
        ) : null}
      </div>

      <div className="mt-8 space-y-6">
        {standard.sections.map((section) => (
          <section key={section.id} className="rounded-2xl border border-rule bg-surface p-5">
            <h2 className="font-display text-base font-semibold text-ink">{section.nameEn}</h2>
            <div className="mt-3 divide-y divide-rule">
              {section.criteria.map((criterion) => {
                const answer = answersByCriterion.get(criterion.id);
                return (
                  <div key={criterion.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="text-ink-soft">{criterion.textEn}</span>
                    <span className="tabular shrink-0 text-ink-faint">
                      {answer ? `${Math.round(answer.achievedPoints)}/${criterion.maxPoints} · ${tStatus(answer.status)}` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
