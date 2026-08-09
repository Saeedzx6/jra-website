"use server";

import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function createCourseWithSession(formData: FormData) {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) throw new Error("Forbidden");

  const title = String(formData.get("title") ?? "");
  const track = formData.get("track") as "CHEFS" | "SERVICE" | "BARISTA" | "MANAGEMENT" | "OTHER";
  const description = String(formData.get("description") ?? "");
  const startDate = new Date(String(formData.get("startDate")));
  const locationText = String(formData.get("locationText") ?? "") || null;
  const capacity = formData.get("capacity") ? Number(formData.get("capacity")) : null;

  const slugBase = slugify(title, { lower: true, strict: true });
  const slug = `${slugBase}-${Date.now().toString(36)}`;

  await db.course.create({
    data: {
      slug,
      track,
      status: "PUBLISHED",
      translations: { create: { locale: "en", title, descriptionHtml: description } },
      sessions: { create: { startDate, locationText, capacity } },
    },
  });

  revalidatePath("/[locale]/admin/training", "page");
  revalidatePath("/[locale]/training", "page");
}

const registrationSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

export async function registerForSession(
  sessionId: string,
  _prevState: { ok: boolean; error?: string },
  formData: FormData
) {
  const parsed = registrationSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  await db.courseRegistration.create({
    data: {
      courseSessionId: sessionId,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      status: "PENDING",
    },
  });

  revalidatePath("/[locale]/admin/training", "page");
  return { ok: true };
}
