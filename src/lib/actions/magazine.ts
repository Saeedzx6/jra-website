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

/**
 * Creates an issue.
 *
 * Articles could always be added to an issue, but nothing could create the
 * issue itself — the two seeded rows were the only containers that would ever
 * exist, so the magazine could never publish a third.
 *
 * Month and year are required because they are what the public page uses to
 * label an issue; `issueNumber` is nullable on the model and stays optional.
 */
export async function createMagazineIssue(formData: FormData): Promise<void> {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) throw new Error("Forbidden");

  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Month must be between 1 and 12.");
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Year looks wrong.");
  }

  const rawNumber = Number(formData.get("issueNumber"));
  const issueNumber = Number.isInteger(rawNumber) && rawNumber > 0 ? rawNumber : null;

  const issue = await db.magazineIssue.create({
    data: {
      month,
      year,
      issueNumber,
      // Draft by default: an issue with no articles and no cover should not
      // appear on the public magazine grid the moment it is created.
      status: "DRAFT",
    },
  });

  await db.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "CREATE",
      entityType: "MAGAZINE_ISSUE",
      entityId: issue.id,
      diff: { month, year, issueNumber } as never,
    },
  });

  revalidatePath("/[locale]/admin/magazine", "page");
  revalidatePath("/[locale]/magazine", "page");
}

export async function setMagazineIssueStatus(id: string, formData: FormData): Promise<void> {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) throw new Error("Forbidden");

  const status = formData.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  await db.magazineIssue.update({ where: { id }, data: { status } });

  revalidatePath("/[locale]/admin/magazine", "page");
  revalidatePath("/[locale]/magazine", "page");
}
