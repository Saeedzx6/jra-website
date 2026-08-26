import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/rbac";
import { getStandardWithCriteria } from "@/lib/classification";
import { ClassificationChecklist } from "@/components/classification/checklist";

export default async function AssessmentSessionPage({
  params,
}: {
  params: Promise<{ locale: string; sessionId: string }>;
}) {
  const { locale, sessionId } = await params;
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const tc = await getTranslations("classification");

  const assessment = await db.assessmentSession.findUnique({
    where: { id: sessionId },
    include: { restaurant: true, answers: true },
  });
  if (!assessment) notFound();

  // Members may only view their own restaurant's assessments; admins see all.
  if (session.user.role !== "ADMIN") {
    const owns = await db.businessManager.findFirst({
      where: { userId: session.user.id, restaurantId: assessment.restaurantId },
    });
    if (!owns) notFound();
  }

  const standard = await getStandardWithCriteria(assessment.establishmentType);
  if (!standard) notFound();

  const criterionMaxPoints = new Map(
    standard.sections.flatMap((s) => s.criteria.map((c) => [c.id, c.maxPoints] as const))
  );
  // Answers saved before marking went binary carry a fraction of the marks.
  // Only a full award counts as met — a historical 6/10 was never a pass
  // against the document, and reading it as one would inflate the total.
  const initialAnswers = Object.fromEntries(
    assessment.answers.map((a) => {
      const maxPoints = criterionMaxPoints.get(a.criterionId) ?? 0;
      return [a.criterionId, { met: maxPoints > 0 && a.achievedPoints >= maxPoints }];
    })
  );

  // A re-rating JRA has not opened yet, or a session already sent for review,
  // is readable but not editable.
  const readOnly = assessment.status !== "IN_PROGRESS";

  return (
    <div>
      <p className="text-xs font-eyebrow font-semibold text-accent">
        {assessment.restaurant.name}
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
        {locale === "ar" && standard.titleAr ? standard.titleAr : standard.titleEn}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        {assessment.status === "REQUESTED" ? tc("reRatingPending") : tc("sessionIntro")}
      </p>

      <div className="mt-8">
        <ClassificationChecklist
          sessionId={assessment.id}
          sections={standard.sections}
          initialAnswers={initialAnswers}
          starBands={standard.starBands}
          totalPoints={standard.totalPossiblePoints}
          gradingMode={standard.gradingMode}
          readOnly={readOnly}
          alreadySubmitted={assessment.status === "SCORED"}
          submittedScore={assessment.totalScore}
          submittedStars={assessment.resultingStars}
        />
      </div>
    </div>
  );
}
