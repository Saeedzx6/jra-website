"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { putFile } from "@/lib/storage";
import { requireAdmin, writeAudit } from "@/lib/rbac";

/**
 * Cover-image management for every content type that has one.
 *
 * Before this, only restaurants could have a photo attached from the admin.
 * News, magazine issues, courses, resources and people all carried an image
 * column that nothing in the back office could write — 64 published articles
 * had a `coverImageUrl` and every one of them was null.
 *
 * The target is a key into a fixed table, never a model name from the client.
 * A generic `db[model].update()` driven by a form field would let anyone with
 * an admin session write an arbitrary column on an arbitrary table; the switch
 * below is deliberately repetitive so that is impossible and so the Prisma
 * types stay sound.
 */

export type MediaTarget = "news" | "magazineIssue" | "course" | "resource" | "person";

const FOLDER: Record<MediaTarget, string> = {
  news: "news",
  magazineIssue: "magazine",
  course: "training",
  resource: "knowledge",
  person: "people",
};

/** Public routes whose content changes when one of these images changes. */
const REVALIDATE: Record<MediaTarget, string[]> = {
  news: ["/[locale]/news", "/[locale]/news/[slug]", "/[locale]"],
  magazineIssue: ["/[locale]/magazine", "/[locale]/magazine/[id]"],
  course: ["/[locale]/training"],
  resource: ["/[locale]/knowledge", "/[locale]/about"],
  person: ["/[locale]/about"],
};

const ADMIN_PATH: Record<MediaTarget, string> = {
  news: "/[locale]/admin/news",
  magazineIssue: "/[locale]/admin/magazine",
  course: "/[locale]/admin/training",
  resource: "/[locale]/admin/knowledge",
  person: "/[locale]/admin/settings",
};

/** 8 MB, and images only. A PDF in a cover slot renders as a broken image. */
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

async function writeUrl(target: MediaTarget, id: string, url: string | null) {
  switch (target) {
    case "news":
      await db.newsArticle.update({ where: { id }, data: { coverImageUrl: url } });
      return;
    case "magazineIssue":
      await db.magazineIssue.update({ where: { id }, data: { coverImageUrl: url } });
      return;
    case "course":
      await db.course.update({ where: { id }, data: { coverImageUrl: url } });
      return;
    case "resource":
      await db.resource.update({ where: { id }, data: { coverImageUrl: url } });
      return;
    case "person":
      await db.person.update({ where: { id }, data: { photoUrl: url } });
      return;
  }
}

function revalidate(target: MediaTarget) {
  revalidatePath(ADMIN_PATH[target], "page");
  for (const p of REVALIDATE[target]) revalidatePath(p, "page");
}

/**
 * Uploads a new cover image and points the record at it.
 *
 * Returns an error string rather than throwing, so the admin form can show it
 * inline instead of the request failing with a stack trace.
 */
export async function setCoverImage(
  target: MediaTarget,
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireAdmin();

  if (!(target in FOLDER)) return { error: "Unknown image target." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image first." };
  }
  if (!ALLOWED.includes(file.type)) {
    return { error: "That file is not an image. Use JPEG, PNG, WebP, AVIF or GIF." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "That image is larger than 8 MB. Please resize it first." };
  }

  const stored = await putFile(file, { folder: FOLDER[target], basename: target });
  await writeUrl(target, id, stored.url);

  await writeAudit(session.user.id, "UPLOAD_IMAGE", target.toUpperCase(), id, {
    url: stored.url,
  });
  revalidate(target);
  return {};
}

/**
 * Detaches the image from the record.
 *
 * The stored file is intentionally left in place. Cover images are frequently
 * swapped and re-attached, and a delete here would break any other record that
 * had been pointed at the same upload.
 */
export async function clearCoverImage(
  target: MediaTarget,
  id: string
): Promise<{ error?: string }> {
  const session = await requireAdmin();
  if (!(target in FOLDER)) return { error: "Unknown image target." };

  await writeUrl(target, id, null);
  await writeAudit(session.user.id, "DELETE_IMAGE", target.toUpperCase(), id, {});
  revalidate(target);
  return {};
}

/* -------------------------------------------------------------------------
 * News galleries
 *
 * `MediaGalleryItem` already existed in the schema, related to both NewsArticle
 * and Event, and was never referenced by a single line of application code —
 * an empty table nobody could write to. Wiring it up gives news articles the
 * extra photos they need without a migration.
 * ---------------------------------------------------------------------- */

export async function uploadNewsGalleryImage(
  newsArticleId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image first." };
  if (!ALLOWED.includes(file.type)) {
    return { error: "That file is not an image. Use JPEG, PNG, WebP, AVIF or GIF." };
  }
  if (file.size > MAX_BYTES) return { error: "That image is larger than 8 MB." };

  const article = await db.newsArticle.findUnique({ where: { id: newsArticleId } });
  if (!article) return { error: "Article not found." };

  const stored = await putFile(file, { folder: `news/${article.slug}`, basename: "gallery" });
  const caption = formData.get("caption");

  await db.mediaGalleryItem.create({
    data: {
      newsArticleId,
      imageUrl: stored.url,
      caption: typeof caption === "string" && caption.trim() ? caption.trim() : null,
    },
  });

  await writeAudit(session.user.id, "UPLOAD_IMAGE", "NEWS_GALLERY", newsArticleId, {
    url: stored.url,
  });
  revalidate("news");
  return {};
}

export async function deleteNewsGalleryImage(itemId: string) {
  const session = await requireAdmin();
  const item = await db.mediaGalleryItem.findUnique({ where: { id: itemId } });
  if (!item) return;

  await db.mediaGalleryItem.delete({ where: { id: itemId } });
  await writeAudit(
    session.user.id,
    "DELETE_IMAGE",
    "NEWS_GALLERY",
    item.newsArticleId ?? itemId,
    { itemId }
  );
  revalidate("news");
}
