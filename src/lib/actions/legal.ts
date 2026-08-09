"use server";

import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function createLegalDocument(formData: FormData) {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) throw new Error("Forbidden");

  const title = String(formData.get("title") ?? "");
  const type = formData.get("type") as "LAW" | "REGULATION" | "INSTRUCTION";
  const topic = String(formData.get("topic") ?? "") || null;
  const entity = String(formData.get("entity") ?? "") || null;
  const year = formData.get("year") ? Number(formData.get("year")) : null;
  const versionLabel = String(formData.get("versionLabel") ?? "1.0");
  const fileUrl = String(formData.get("fileUrl") ?? "") || null;
  const bodyHtml = String(formData.get("bodyHtml") ?? "") || null;

  const slug = `${slugify(title, { lower: true, strict: true })}-${Date.now().toString(36)}`;

  await db.legalDocument.create({
    data: {
      slug,
      type,
      topic,
      entity,
      year,
      isCurrent: true,
      versions: { create: { versionLabel, publishedAt: new Date(), fileUrl, bodyHtml } },
    },
  });

  revalidatePath("/[locale]/admin/legal", "page");
  revalidatePath("/[locale]/legal", "page");
}

export async function addLegalDocumentVersion(documentId: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) throw new Error("Forbidden");

  const versionLabel = String(formData.get("versionLabel") ?? "");
  const fileUrl = String(formData.get("fileUrl") ?? "") || null;
  const bodyHtml = String(formData.get("bodyHtml") ?? "") || null;

  await db.legalDocumentVersion.create({
    data: { legalDocumentId: documentId, versionLabel, publishedAt: new Date(), fileUrl, bodyHtml },
  });

  revalidatePath("/[locale]/admin/legal/[id]", "page");
  revalidatePath("/[locale]/legal/[slug]", "page");
}
