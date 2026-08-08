/**
 * One-off: pushes everything under public/uploads to Cloudinary and rewrites
 * the database URLs to point at the CDN.
 *
 * Safe to re-run — rows whose url is already an https link are skipped, so an
 * interrupted run picks up where it stopped.
 *
 *   npm run migrate:images -- --dry     preview, changes nothing
 *   npm run migrate:images              do it
 *
 * NOTE: this script used to cover restaurant images and the site settings only.
 * Every other table that stores a /uploads/... path (staff photos, resources,
 * classification standards, magazine PDFs, ...) was left behind, so those files
 * 404'd in production. Those assets are now committed under public/uploads and
 * served statically, and this script covers their tables too — so migrating
 * them to the CDN is an option rather than a prerequisite for a working deploy.
 */

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

const db = new PrismaClient();
const DRY = process.argv.includes("--dry");
const PUBLIC_DIR = path.join(process.cwd(), "public");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function assertConfigured() {
  const missing = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]
    .filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
}

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"]);

/** Uploads one local file, returning its CDN url. */
async function upload(localUrl: string): Promise<string | null> {
  // Paths are stored unencoded, but a percent-encoded one would still resolve.
  // decodeURIComponent throws on a stray `%`, so it only ever gets to be a
  // fallback for the literal path.
  let abs = path.join(PUBLIC_DIR, localUrl);
  if (!fs.existsSync(abs)) {
    try {
      abs = path.join(PUBLIC_DIR, decodeURIComponent(localUrl));
    } catch {
      /* not percent-encoded — keep the literal path and fail below */
    }
  }
  if (!fs.existsSync(abs)) {
    console.warn(`  missing on disk, skipped: ${localUrl}`);
    return null;
  }

  // Documents (PDF, docx, pptx) must go up as `raw`. Sending them as `image`
  // either fails or lands them behind Cloudinary's PDF-delivery restriction,
  // which is how the annual reports and classification standards would break.
  const ext = path.extname(abs).toLowerCase();
  const isImage = IMAGE_EXTS.has(ext);

  // Mirror the on-disk layout under a jra/ prefix so the CDN stays browsable.
  // The prefix lives in public_id, not the `folder` option — under "dynamic
  // folders" mode `folder` sets only a display folder and leaves public_id bare.
  // `raw` public_ids keep their extension; image public_ids drop it.
  const rel = localUrl.replace(/^\/uploads\//, "");
  const publicId = isImage ? `jra/${rel.replace(/\.[^.]+$/, "")}` : `jra/${rel}`;

  const res = await cloudinary.uploader.upload(abs, {
    public_id: publicId,
    overwrite: false,
    resource_type: isImage ? "image" : "raw",
  });
  return res.secure_url;
}

/**
 * Every column that stores a local /uploads/... path. Anything added here gets
 * migrated; leaving a column out is what caused the original 404s, so add new
 * media columns to this list when the schema grows one.
 */
const TARGETS: { model: string; field: string }[] = [
  { model: "restaurantImage", field: "url" },
  { model: "supplierImage", field: "url" },
  { model: "marketplaceListingImage", field: "url" },
  { model: "mediaGalleryItem", field: "imageUrl" },
  { model: "newsArticle", field: "coverImageUrl" },
  { model: "event", field: "coverImageUrl" },
  { model: "classificationStandard", field: "sourcePdfUrl" },
  { model: "legalDocumentVersion", field: "fileUrl" },
  { model: "magazineIssue", field: "coverImageUrl" },
  { model: "magazineIssue", field: "pdfUrl" },
  { model: "course", field: "coverImageUrl" },
  { model: "resource", field: "fileUrl" },
  { model: "resource", field: "coverImageUrl" },
  { model: "person", field: "photoUrl" },
];

async function migrateColumn(model: string, field: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegate = (db as any)[model];
  // Filtered in JS rather than in the query: `{ not: null }` is rejected on the
  // non-nullable columns (restaurant_images.url), and a bare `NOT startsWith`
  // silently drops NULL rows on the nullable ones. These tables are small
  // enough that reading the column and filtering here is simpler than
  // branching on each column's nullability.
  const all: { id: string; [k: string]: string | null }[] = await delegate.findMany({
    select: { id: true, [field]: true },
  });
  const rows = all.filter((r) => {
    const v = r[field];
    return typeof v === "string" && v.length > 0 && !v.startsWith("http");
  });
  if (!rows.length) return;
  console.log(`${model}.${field}: ${rows.length} to migrate (of ${all.length})`);

  let done = 0;
  for (const row of rows) {
    if (DRY) {
      done++;
      continue;
    }
    const localPath = row[field];
    if (!localPath) continue;
    const url = await upload(localPath);
    if (!url) continue;
    // legacyPath keeps the original location so a bad run can be reversed. Only
    // restaurant_images carries that column.
    const data: Record<string, string> =
      model === "restaurantImage" ? { [field]: url, legacyPath: localPath } : { [field]: url };
    await delegate.update({ where: { id: row.id }, data });
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${rows.length}`);
  }
  console.log(`${model}.${field}: ${done} done`);
}

async function migrateSiteSettings() {
  const s = await db.siteSetting.findUnique({ where: { id: "singleton" } });
  if (!s) return;

  const patch: Record<string, string> = {};
  for (const field of ["heroImageUrl", "showcaseOneUrl", "showcaseTwoUrl"] as const) {
    const value = s[field];
    if (!value || value.startsWith("http")) continue;
    if (DRY) {
      console.log(`site_settings.${field} would migrate`);
      continue;
    }
    const url = await upload(value);
    if (url) patch[field] = url;
  }
  if (Object.keys(patch).length && !DRY) {
    await db.siteSetting.update({ where: { id: "singleton" }, data: patch });
    console.log(`site_settings: ${Object.keys(patch).join(", ")} updated`);
  }
}

async function main() {
  if (!DRY) assertConfigured();
  console.log(DRY ? "== DRY RUN ==" : "== MIGRATING ==");
  for (const { model, field } of TARGETS) {
    await migrateColumn(model, field);
  }
  await migrateSiteSettings();
  console.log("done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
