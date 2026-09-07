import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type Role = "ADMIN" | "EDITOR" | "RESTAURANT_MEMBER" | "SUPPLIER_MEMBER";

export async function requireRole(roles: Role[]) {
  const session = await auth();
  if (!session?.user || !roles.includes(session.user.role as Role)) {
    return null;
  }
  return session;
}

export async function getSession() {
  return auth();
}

/**
 * Back-office gate. Throws rather than returning null: every caller is a
 * server action that must not continue without a session, and an early throw
 * is harder to forget to check than a nullable return.
 *
 * Lived privately in `actions/admin.ts` until `actions/media.ts` needed it
 * too. A `"use server"` module may only export async actions, so shared
 * helpers cannot live there.
 */
export async function requireAdmin() {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) throw new Error("Forbidden");
  return session;
}

/** Appends to the audit trail. Callers pass whatever diff is meaningful. */
export async function writeAudit(
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  diff?: unknown
) {
  await db.auditLog.create({
    data: { actorUserId, action, entityType, entityId, diff: diff as never },
  });
}
