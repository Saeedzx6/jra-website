import { notFound } from "next/navigation";
import { Check, Minus, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getStandardWithCriteria } from "@/lib/classification";
import { AssessmentReview } from "@/components/admin/assessment-review";
import { ReRatingRequestReview } from "@/components/admin/re-rating-request-review";

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

  const answersByCriterion = new Map(session.answers.map((a) => [a.criterionId, a]));

  // The grade this establishment was last awarded, so a reviewer looking at a
  // re-rating can see what it is being measured against rather than judging
  // the new submission in isolation.
  const previous =
    session.cycle > 1
      ? await db.assessmentSession.findFirst({
          where: { restaurantId: session.restaurantId, status: "APPROVED", cycle: { lt: session.cycle } },
          orderBy: { cycle: "desc" },
        })
      : null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-brass-text">
        {session.establishmentType}
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
        {session.restaurant.name}
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-4">
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
        {session.cycle > 1 ? (
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-soft">
            {ta("cycleLabel", { cycle: session.cycle })}
            {previous?.resultingStars
              ? ` · ${ta("previouslyAwarded", { stars: previous.resultingStars })}`
              : ""}
          </span>
        ) : null}
      </div>

      {/* The decision. Everything below is the evidence it is made on. */}
      <div className="mt-6">
        {session.status === "REQUESTED" ? (
          <ReRatingRequestReview sessionId={session.id} reason={session.requestedReason} />
        ) : (
          <AssessmentReview
            sessionId={session.id}
            stars={session.resultingStars}
            gradingMode={standard.gradingMode}
            decided={
              session.status === "APPROVED" || session.status === "REJECTED" ? session.status : null
            }
            reviewNote={session.reviewNote}
          />
        )}
      </div>

      <div className="mt-8 space-y-6">
        {standard.sections.map((section) => {
          let lastGroup: string | null = null;
          return (
            <section key={section.id} className="rounded-2xl border border-rule bg-surface p-5">
              <h2 className="font-display text-base font-semibold text-ink">{section.nameEn}</h2>
              <div className="mt-3">
                {section.criteria.map((criterion) => {
                  const answer = answersByCriterion.get(criterion.id);
                  const met = answer?.status === "MET";
                  const showGroup =
                    !!criterion.groupEn &&
                    criterion.groupEn !== lastGroup &&
                    criterion.groupEn !== section.nameEn;
                  if (criterion.groupEn) lastGroup = criterion.groupEn;

                  return (
                    <div key={criterion.id}>
                      {showGroup ? (
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                          {criterion.groupEn}
                        </p>
                      ) : null}
                      <div className="flex items-start gap-3 border-t border-rule py-2 text-sm first:border-t-0">
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                            met ? "bg-success-soft text-success-text" : "bg-surface-2 text-ink-faint"
                          }`}
                        >
                          {met ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          ) : (
                            <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 text-ink-soft">
                          {criterion.code ? (
                            <span className="tabular me-1.5 text-xs text-ink-faint">
                              {criterion.code}
                            </span>
                          ) : null}
                          {criterion.textEn}
                          {criterion.mandatory ? (
                            <span className="ms-2 text-xs font-semibold text-accent-strong">
                              {ta("mandatory")}
                            </span>
                          ) : null}
                        </span>
                        <span className="tabular shrink-0 text-xs text-ink-faint">
                          {met ? criterion.maxPoints : 0}/{criterion.maxPoints}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
