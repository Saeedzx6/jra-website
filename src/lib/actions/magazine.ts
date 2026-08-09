"use server";

import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function createMagazineArticle(issueId: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) throw new Error("Forbidden");

  const title = String(formData.get("title") ?? "");
  const category = String(formData.get("category") ?? "") || null;
  const accessLevel = formData.get("accessLevel") as "PUBLIC" | "MEMBERS_ONLY";
  const bodyHtml = String(formData.get("bodyHtml") ?? "");

  const slug = `${slugify(title, { lower: true, strict: true })}-${Date.now().toString(36)}`;

  await db.magazineArticle.create({
    data: {
      issueId,
      slug,
      category,
      accessLevel,
      translations: { create: { locale: "en", title, bodyHtml } },
    },
  });

  revalidatePath("/[locale]/admin/magazine", "page");
  revalidatePath("/[locale]/magazine/[id]", "page");
}
