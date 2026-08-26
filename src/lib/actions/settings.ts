"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { putFile } from "@/lib/storage";

async function requireAdmin() {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) throw new Error("Forbidden");
  return session;
}

export async function getSiteSettings() {
  return db.siteSetting.findUnique({ where: { id: "singleton" } });
}

/** Which of the two hero showcase slots an upload targets. */
type ShowcaseSlot = "one" | "two";

const SHOWCASE_FIELD = {
  one: "showcaseOneUrl",
  two: "showcaseTwoUrl",
} as const;

function readSlot(formData: FormData): ShowcaseSlot {
  return formData.get("slot") === "two" ? "two" : "one";
}

