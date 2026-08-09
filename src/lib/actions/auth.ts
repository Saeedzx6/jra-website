"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";

export async function loginAction(
  _prevState: { ok: boolean; error?: string },
  formData: FormData
) {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = formData.get("password");

  // Looked up only to pick the right landing page — signIn()/authorize() below
  // still does the real credential check, so a wrong password still fails.
  const user = await db.user.findUnique({ where: { email }, select: { role: true } });
  const destination = user && ["ADMIN", "EDITOR"].includes(user.role) ? "/admin" : "/portal";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: destination,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "invalid-credentials" };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
