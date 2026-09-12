import { describe, expect, it } from "vitest";
import {
  canRequestReRating,
  isDecided,
  nextAction,
  nextCycle,
  type AssessmentStatus,
  type LatestSession,
} from "./classification-lifecycle";

/**
 * These rules decide whether an establishment can rate itself again. Getting
 * them wrong either locks a member out of a grade they are entitled to
 * re-earn, or lets them resubmit until they like the number — so each state
 * is pinned explicitly rather than inferred from a default branch.
 */

const at = (status: AssessmentStatus, cycle = 1): LatestSession => ({ status, cycle });

describe("nextAction", () => {
  it("offers the setup rating when the establishment has never been rated", () => {
    expect(nextAction(null)).toBe("start");
  });

  it("offers a fresh start after a refusal", () => {
    // A refusal comes with a reason. It is a dead end, not a lock — the
    // establishment fixes what it was told and begins again.
    expect(nextAction(at("REJECTED"))).toBe("start");
  });

  it("resumes a rating that is still being filled in", () => {
    expect(nextAction(at("IN_PROGRESS"))).toBe("resume");
  });

  it("waits while JRA holds the submission", () => {
    expect(nextAction(at("SUBMITTED"))).toBe("waiting");
    expect(nextAction(at("SCORED"))).toBe("waiting");
  });

  it("waits on a re-rating JRA has not opened yet", () => {
    expect(nextAction(at("REQUESTED", 2))).toBe("waiting");
  });

  it("requires a request once a grade has been awarded", () => {
    expect(nextAction(at("APPROVED"))).toBe("request");
  });
});

describe("canRequestReRating", () => {
  it("allows a request against an awarded grade", () => {
    expect(canRequestReRating(at("APPROVED"))).toBe(true);
  });

  it("refuses a request from an establishment that has never been rated", () => {
    expect(canRequestReRating(null)).toBe(false);
  });

  it("refuses a second request while one is already open", () => {
    expect(canRequestReRating(at("REQUESTED", 2))).toBe(false);
    expect(canRequestReRating(at("IN_PROGRESS", 2))).toBe(false);
  });

  it("refuses a request while a submission is with JRA", () => {
    // Otherwise an owner could queue cycle 3 before cycle 2 was even reviewed.
    expect(canRequestReRating(at("SCORED"))).toBe(false);
    expect(canRequestReRating(at("SUBMITTED"))).toBe(false);
  });

  it("refuses a request after a refusal, which is restarted instead", () => {
    expect(canRequestReRating(at("REJECTED"))).toBe(false);
    expect(nextAction(at("REJECTED"))).toBe("start");
  });
});

describe("nextCycle", () => {
  it("numbers the setup rating 1", () => {
    expect(nextCycle(null)).toBe(1);
  });

  it("counts up from the most recent cycle", () => {
    expect(nextCycle(at("APPROVED", 1))).toBe(2);
    expect(nextCycle(at("APPROVED", 7))).toBe(8);
  });
});

describe("isDecided", () => {
  it("counts only the outcomes JRA has ruled on", () => {
    expect(isDecided("APPROVED")).toBe(true);
    expect(isDecided("REJECTED")).toBe(true);
    expect(isDecided("SCORED")).toBe(false);
    expect(isDecided("REQUESTED")).toBe(false);
    expect(isDecided("IN_PROGRESS")).toBe(false);
  });
});
