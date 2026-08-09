import { auth } from "@/lib/auth";

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
