"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getSession, requireRole } from "@/lib/rbac";
import { getStandardWithCriteria } from "@/lib/classification";
import {
  criterionAchievedPoints,
  criterionStatus,
  starsForScore,
  type CriterionValue,
} from "@/lib/classification-scoring";

export async function startOrResumeAssessment(restaurantId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw new Error("Restaurant not found");

  const existing = await db.assessmentSession.findFirst({
    where: { restaurantId, status: "IN_PROGRESS" },
  });
  if (existing) return existing.id;

  const created = await db.assessmentSession.create({
    data: {
      restaurantId,
      establishmentType: restaurant.establishmentType,
      startedById: session.user.id,
      status: "IN_PROGRESS",
    },
  });
  return created.id;
}

export async function startAssessmentAndRedirect(restaurantId: string) {
  const id = await startOrResumeAssessment(restaurantId);
  const locale = await getLocale();
  redirect(`/${locale}/portal/classification/${id}`);
}

export async function saveAnswer(sessionId: string, criterionId: string, value: CriterionValue) {
  const criterion = await db.classificationCriterion.findUnique({ where: { id: criterionId } });
  if (!criterion) throw new Error("Criterion not found");

  const achievedPoints = criterionAchievedPoints(criterion.maxPoints, value);
  const status = criterionStatus(value);

  await db.assessmentAnswer.upsert({
    where: { sessionId_criterionId: { sessionId, criterionId } },
    update: { status, achievedPoints },
    create: { sessionId, criterionId, status, achievedPoints },
  });

  const answers = await db.assessmentAnswer.findMany({ where: { sessionId } });
  const totalScore = answers.reduce((sum, a) => sum + a.achievedPoints, 0);

  await db.assessmentSession.update({ where: { id: sessionId }, data: { totalScore } });

  revalidatePath("/[locale]/portal/classification/[sessionId]", "page");
  return { totalScore };
}

export async function submitAssessment(sessionId: string) {
  const session = await db.assessmentSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Session not found");

  const standard = await getStandardWithCriteria(session.establishmentType);
  if (!standard) throw new Error("Standard not found");

  const answers = await db.assessmentAnswer.findMany({ where: { sessionId } });
  const totalScore = answers.reduce((sum, a) => sum + a.achievedPoints, 0);
  const resultingStars = starsForScore(totalScore, standard.starBands);

  await db.assessmentSession.update({
    where: { id: sessionId },
    data: {
      status: "SCORED",
      totalScore,
      resultingStars,
      submittedAt: new Date(),
    },
  });

  revalidatePath("/[locale]/portal/classification/[sessionId]", "page");
  return { totalScore, resultingStars };
}

// --- JRA review ------------------------------------------------------------

/**
 * Awards the grade a submitted assessment earned.
 *
 * This is the step that was missing. submitAssessment computed a score and a
 * star result and wrote both to the session, where they stopped: nothing
 * carried the grade to the listing, so the star filter, the card badge, the
 * profile stars, the structured data and the dues tier all stayed empty no
 * matter how many assessments were reviewed.
 *
 * The grade JRA awards is taken from the session rather than recomputed, so
 * what the reviewer saw on screen is what gets awarded. Re-running the scoring
 * here would risk awarding something different if a standard were edited
 * between submission and review.
 */
export async function approveAssessment(sessionId: string, note?: string) {
  const admin = await requireRole(["ADMIN", "EDITOR"]);
  if (!admin) throw new Error("Forbidden");

  const session = await db.assessmentSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Session not found");
  if (session.status === "IN_PROGRESS") throw new Error("Assessment has not been submitted");
  if (session.resultingStars == null) throw new Error("Assessment has no result to award");

  const level = await db.classificationLevel.findUnique({
    where: { stars: session.resultingStars },
  });
  if (!level) throw new Error(`No classification level for ${session.resultingStars} stars`);

  await db.$transaction([
    db.restaurant.update({
      where: { id: session.restaurantId },
      data: { classificationLevelId: level.id },
    }),
    db.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: "APPROVED",
        reviewedById: admin.user.id,
        reviewedAt: new Date(),
        reviewNote: note?.trim() || null,
      },
    }),
  ]);

  revalidatePath("/[locale]/admin/assessments", "page");
  revalidatePath("/[locale]/admin/assessments/[id]", "page");
  revalidatePath("/[locale]/restaurants/[slug]", "page");
  revalidatePath("/[locale]/restaurants", "page");

  return { stars: session.resultingStars };
}

/**
 * Refuses a submitted assessment, leaving any existing grade untouched.
 *
 * The note is required: an applicant told only "no" has nothing to act on, and
 * this is the reply to a submission someone spent real effort on.
 */
export async function rejectAssessment(sessionId: string, note: string) {
  const admin = await requireRole(["ADMIN", "EDITOR"]);
  if (!admin) throw new Error("Forbidden");
  if (!note.trim()) throw new Error("A reason is required when refusing an assessment");

  await db.assessmentSession.update({
    where: { id: sessionId },
    data: {
      status: "REJECTED",
      reviewedById: admin.user.id,
      reviewedAt: new Date(),
      reviewNote: note.trim(),
    },
  });

  revalidatePath("/[locale]/admin/assessments", "page");
  revalidatePath("/[locale]/admin/assessments/[id]", "page");
}
