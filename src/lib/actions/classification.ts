"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/rbac";
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
