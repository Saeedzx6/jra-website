"use server";

import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function createResource(formData: FormData) {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) throw new Error("Forbidden");

  const type = formData.get("type") as
    | "STUDY"
    | "GUIDE"
    | "TEMPLATE"
    | "PROJECT"
    | "OPPORTUNITY"
    | "CASE_STUDY";
  const title = String(formData.get("title") ?? "");
  const summary = String(formData.get("summary") ?? "") || null;
  const fileUrl = String(formData.get("fileUrl") ?? "") || null;
  const deadlineAt = formData.get("deadlineAt") ? new Date(String(formData.get("deadlineAt"))) : null;

  const slug = `${slugify(title, { lower: true, strict: true })}-${Date.now().toString(36)}`;

  const resource = await db.resource.create({
    data: { type, slug, fileUrl, deadlineAt, status: "PUBLISHED" },
  });

  await db.resourceTranslation.create({
    data: { resourceId: resource.id, locale: "en", title, summary },
  });

  revalidatePath("/[locale]/admin/knowledge", "page");
  revalidatePath("/[locale]/projects", "page");
  revalidatePath("/[locale]/opportunities", "page");
  revalidatePath("/[locale]/knowledge", "page");
}
