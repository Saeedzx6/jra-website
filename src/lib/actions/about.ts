"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { putFile } from "@/lib/storage";
import { requireAdmin, writeAudit } from "@/lib/rbac";
import { ok, fail, type ActionState } from "@/lib/action-state";
import { UPLOAD_MAX_BYTES as MAX_BYTES } from "@/lib/prepare-image";
import { toVideoEmbed } from "@/lib/video-embed";

/**
 * The About page's carousel and video.
 *
 * Both are content, so both are editable. The alternative — a developer
 * committing a new photograph every time the board sits for one — is the thing
 * this whole back office exists to avoid.
 */

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

function revalidateAbout() {
  revalidatePath("/[locale]/admin/about", "page");
  revalidatePath("/[locale]/about", "page");
}

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : null;
}

export async function addAboutSlide(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();
  const t = await getTranslations("admin.feedback");
  const ta = await getTranslations("admin.about");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail(t("chooseImage"));
  if (!ALLOWED.includes(file.type)) return fail(t("notAnImage"));
  if (file.size > MAX_BYTES) return fail(t("imageTooLarge"));

  const stored = await putFile(file, { folder: "about", basename: "slide" });

  // New slides go to the end rather than the front, so adding one does not
  // silently change what a visitor sees first.
  const last = await db.aboutSlide.findFirst({ orderBy: { sortOrder: "desc" } });

  const slide = await db.aboutSlide.create({
    data: {
      imageUrl: stored.url,
      captionEn: str(formData, "captionEn"),
      captionAr: str(formData, "captionAr"),
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  await writeAudit(session.user.id, "CREATE", "ABOUT_SLIDE", slide.id, { url: stored.url });
  revalidateAbout();
  return ok(ta("slideAdded"));
}

export async function updateAboutSlide(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();
  const t = await getTranslations("admin.feedback");

  const order = Number(formData.get("sortOrder"));

  await db.aboutSlide.update({
    where: { id },
    data: {
      captionEn: str(formData, "captionEn"),
      captionAr: str(formData, "captionAr"),
      sortOrder: Number.isFinite(order) ? order : 0,
      isActive: formData.get("isActive") === "on",
    },
  });

  await writeAudit(session.user.id, "UPDATE", "ABOUT_SLIDE", id, {});
  revalidateAbout();
  return ok(t("saved"));
}

export async function deleteAboutSlide(
  id: string,
  _prev: ActionState
): Promise<ActionState> {
  const session = await requireAdmin();
  const t = await getTranslations("admin.feedback");
  const ta = await getTranslations("admin.about");

  const slide = await db.aboutSlide.findUnique({ where: { id } });
  if (!slide) return fail(t("notFound"));

  await db.aboutSlide.delete({ where: { id } });
  await writeAudit(session.user.id, "DELETE", "ABOUT_SLIDE", id, {});
  revalidateAbout();
  return ok(ta("slideDeleted"));
}

/**
 * Stores the About page video.
 *
 * The URL is validated by parsing it into an embed rather than by pattern
 * alone: if `toVideoEmbed` cannot make an embeddable URL from it, the page
 * would render nothing, and finding that out on the public site is worse than
 * being told here.
 */
export async function setAboutVideo(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();
  const t = await getTranslations("admin.feedback");
  const ta = await getTranslations("admin.about");

  const raw = str(formData, "aboutVideoUrl");

  if (raw && !toVideoEmbed(raw)) return fail(ta("videoNotRecognised"));

  await db.siteSetting.upsert({
    where: { id: "singleton" },
    update: { aboutVideoUrl: raw },
    create: { id: "singleton", aboutVideoUrl: raw },
  });

  await writeAudit(session.user.id, "UPDATE", "SITE_SETTING", "singleton", {
    aboutVideoUrl: raw,
  });
  revalidateAbout();
  return ok(raw ? t("saved") : ta("videoCleared"));
}
