/**
 * When an establishment may rate itself, and when it must ask.
 *
 * An establishment rates itself once, when it joins. After JRA rules on that
 * rating, running the checklist again is something the association opens, not
 * something the establishment helps itself to — otherwise an owner can
 * resubmit until they like the number, and the review queue fills with
 * duplicates of the same venue.
 *
 * The rules live here rather than inside the server actions so they can be
 * tested, and so the portal decides what button to show from the same
 * function that decides whether the action is allowed. Those two disagreeing
 * is how a UI ends up offering a button that always errors.
 */

export type AssessmentStatus =
  | "REQUESTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "SCORED"
  | "APPROVED"
  | "REJECTED";

export type LatestSession = { status: AssessmentStatus; cycle: number } | null;

/** A rating JRA has finished with, one way or the other. */
export function isDecided(status: AssessmentStatus): boolean {
  return status === "APPROVED" || status === "REJECTED";
}

/**
 * What the establishment can do next.
 *
 * - `start`   — no rating yet, or the last one was refused and they were told
 *               what to fix. Refusal is a dead end, not a lock: they may
 *               simply begin again.
 * - `resume`  — a rating is open and unfinished.
 * - `waiting` — submitted, or a re-rating requested; the next move is JRA's.
 * - `request` — a grade is held, so a new cycle has to be asked for.
 */
export function nextAction(latest: LatestSession): "start" | "resume" | "waiting" | "request" {
  if (!latest) return "start";
  switch (latest.status) {
    case "REJECTED":
      return "start";
    case "IN_PROGRESS":
      return "resume";
    case "APPROVED":
      return "request";
    case "REQUESTED":
    case "SUBMITTED":
    case "SCORED":
      return "waiting";
  }
}

/**
 * A re-rating may only be asked for against a grade that was actually
 * awarded. A refused rating is restarted directly, and asking while one is
 * already open would queue a second cycle for the same establishment.
 */
export function canRequestReRating(latest: LatestSession): boolean {
  return latest?.status === "APPROVED";
}

/** The cycle number a newly created session should carry. */
export function nextCycle(latest: LatestSession): number {
  return (latest?.cycle ?? 0) + 1;
}
