"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getSession, requireRole } from "@/lib/rbac";
import { getStandardWithCriteria } from "@/lib/classification";
import { canRequestReRating, nextCycle } from "@/lib/classification-lifecycle";
import {
  criterionAchievedPoints,
  criterionStatus,
  starsForScore,
  type CriterionValue,
} from "@/lib/classification-scoring";

/** Members may act on their own establishment; admins on any. */
async function requireManagerOf(restaurantId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role === "ADMIN") return session;

  const owns = await db.businessManager.findFirst({
    where: { userId: session.user.id, restaurantId },
  });
  if (!owns) throw new Error("Forbidden");
  return session;
}

/**
 * Opens the establishment's setup rating, or returns the one it already has.
 *
 * An establishment rates itself once when it joins. This used to create a
 * fresh session on every call, so the "start new" button quietly produced
 * parallel assessments for the same restaurant — several in-progress records,
 * no way to tell which was authoritative, and a review queue with duplicates
 * in it. Anything after the first rating is a re-rating, which goes through
 * requestReRating and has to be opened by JRA.
 *
 * A refused session is the one exception: it is a dead end, and the
 * establishment has to be able to start again after being told why.
 */
export async function startOrResumeAssessment(restaurantId: string) {
  const session = await requireManagerOf(restaurantId);

  const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw new Error("Restaurant not found");

  const existing = await db.assessmentSession.findFirst({
    where: { restaurantId, status: { not: "REJECTED" } },
    orderBy: { cycle: "desc" },
  });
  if (existing) return existing.id;

  const refused = await db.assessmentSession.findFirst({
    where: { restaurantId },
    orderBy: { cycle: "desc" },
  });

  const created = await db.assessmentSession.create({
    data: {
      restaurantId,
      establishmentType: restaurant.establishmentType,
      startedById: session.user.id,
      status: "IN_PROGRESS",
      cycle: nextCycle(refused),
    },
  });
  return created.id;
}

/**
 * Asks JRA to open a fresh rating cycle.
 *
 * A grade is an award, not a self-declaration, so an establishment cannot
 * simply re-run the checklist until it likes the number — it asks, with a
 * reason, and JRA decides. The request is stored as a REQUESTED session so it
 * queues alongside submissions instead of needing a table of its own.
 */
export async function requestReRating(restaurantId: string, reason: string) {
  const session = await requireManagerOf(restaurantId);
  if (!reason.trim()) throw new Error("A reason is required to request a re-rating");

  const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw new Error("Restaurant not found");

  const latest = await db.assessmentSession.findFirst({
    where: { restaurantId },
    orderBy: { cycle: "desc" },
  });
  if (!canRequestReRating(latest)) {
    throw new Error(
      latest
        ? "There is no awarded grade to re-rate, or an assessment is already open"
        : "This establishment has not been rated yet"
    );
  }

  const created = await db.assessmentSession.create({
    data: {
      restaurantId,
      establishmentType: restaurant.establishmentType,
      startedById: session.user.id,
      status: "REQUESTED",
      cycle: nextCycle(latest),
      requestedReason: reason.trim(),
    },
  });

  revalidatePath("/[locale]/portal/classification", "page");
  revalidatePath("/[locale]/admin/assessments", "page");
  return created.id;
}

/** JRA opens a requested re-rating, letting the establishment fill it in. */
export async function openReRating(sessionId: string) {
  const admin = await requireRole(["ADMIN", "EDITOR"]);
  if (!admin) throw new Error("Forbidden");

  const existing = await db.assessmentSession.findUnique({ where: { id: sessionId } });
  if (!existing) throw new Error("Session not found");
  if (existing.status !== "REQUESTED") throw new Error("That re-rating is not awaiting a decision");

  await db.assessmentSession.update({
    where: { id: sessionId },
    data: { status: "IN_PROGRESS", reviewedById: admin.user.id, reviewedAt: new Date() },
  });

  revalidatePath("/[locale]/admin/assessments", "page");
  revalidatePath("/[locale]/portal/classification", "page");
}

/**
 * Refuses a re-rating request. The note is required for the same reason it is
 * on rejectAssessment: an establishment told only "no" has nothing to act on.
 */
export async function declineReRating(sessionId: string, note: string) {
  const admin = await requireRole(["ADMIN", "EDITOR"]);
  if (!admin) throw new Error("Forbidden");
  if (!note.trim()) throw new Error("A reason is required when refusing a re-rating");

  const existing = await db.assessmentSession.findUnique({ where: { id: sessionId } });
  if (!existing) throw new Error("Session not found");
  if (existing.status !== "REQUESTED") throw new Error("That re-rating is not awaiting a decision");

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
  revalidatePath("/[locale]/portal/classification", "page");
}

export async function startAssessmentAndRedirect(restaurantId: string) {
  const id = await startOrResumeAssessment(restaurantId);
  const locale = await getLocale();
  redirect(`/${locale}/portal/classification/${id}`);
}

/**
 * Records one answer.
 *
 * The checks here are not duplicates of the ones the checklist already makes.
 * The component renders read-only for a session that is not IN_PROGRESS, but
 * a server action is a public endpoint: without these, anyone holding a
 * session id could edit another establishment's answers, or amend a rating
 * already sitting in JRA's review queue.
 */
export async function saveAnswer(sessionId: string, criterionId: string, value: CriterionValue) {
  const assessment = await db.assessmentSession.findUnique({ where: { id: sessionId } });
  if (!assessment) throw new Error("Session not found");
  await requireManagerOf(assessment.restaurantId);
  if (assessment.status !== "IN_PROGRESS") {
    throw new Error("This assessment is not open for changes");
  }

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
  await requireManagerOf(session.restaurantId);
  if (session.status !== "IN_PROGRESS") throw new Error("This assessment is not open for changes");

  const standard = await getStandardWithCriteria(session.establishmentType);
  if (!standard) throw new Error("Standard not found");

  const answers = await db.assessmentAnswer.findMany({ where: { sessionId } });
  const totalScore = answers.reduce((sum, a) => sum + a.achievedPoints, 0);
  // A certification standard has no bands to place a score in — fast food is
  // approved or it is not, and that call is JRA's at review.
  const resultingStars =
    standard.gradingMode === "CERTIFICATION"
      ? null
      : starsForScore(totalScore, standard.starBands);

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
  if (session.status === "IN_PROGRESS" || session.status === "REQUESTED") {
    throw new Error("Assessment has not been submitted");
  }

  const decision = {
    status: "APPROVED" as const,
    reviewedById: admin.user.id,
    reviewedAt: new Date(),
    reviewNote: note?.trim() || null,
  };

  // A certification standard awards no stars, so there is no level to write to
  // the listing — approving it records the decision and nothing else.
  if (session.resultingStars == null) {
    const standard = await getStandardWithCriteria(session.establishmentType);
    if (standard?.gradingMode !== "CERTIFICATION") {
      throw new Error("Assessment has no result to award");
    }
    await db.assessmentSession.update({ where: { id: sessionId }, data: decision });
  } else {
    const level = await db.classificationLevel.findUnique({
      where: { stars: session.resultingStars },
    });
    if (!level) throw new Error(`No classification level for ${session.resultingStars} stars`);

    await db.$transaction([
      db.restaurant.update({
        where: { id: session.restaurantId },
        data: { classificationLevelId: level.id },
      }),
      db.assessmentSession.update({ where: { id: sessionId }, data: decision }),
    ]);
  }

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
