/**
 * One-off: pushes everything under public/uploads to Cloudinary and rewrites
 * the database URLs to point at the CDN.
 *
 * Safe to re-run — rows whose url is already an https link are skipped, so an
 * interrupted run picks up where it stopped.
 *
 *   npm run migrate:images -- --dry     preview, changes nothing
 *   npm run migrate:images              do it
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

/** Uploads one local file, returning its CDN url. */
async function upload(localUrl: string): Promise<string | null> {
  const abs = path.join(PUBLIC_DIR, localUrl);
  if (!fs.existsSync(abs)) {
    console.warn(`  missing on disk, skipped: ${localUrl}`);
    return null;
  }

  // Mirror the on-disk layout under a jra/ prefix so the CDN stays browsable.
  // The prefix lives in public_id, not the `folder` option — under "dynamic
  // folders" mode `folder` sets only a display folder and leaves public_id bare.
  const rel = localUrl.replace(/^\/uploads\//, "").replace(/\.[^.]+$/, "");
  const res = await cloudinary.uploader.upload(abs, {
    public_id: `jra/${rel}`,
    overwrite: false,
    resource_type: "image",
  });
  return res.secure_url;
}

async function migrateRestaurantImages() {
  const rows = await db.restaurantImage.findMany({
    where: { NOT: { url: { startsWith: "http" } } },
    select: { id: true, url: true },
  });
  console.log(`restaurant_images: ${rows.length} to migrate`);

  let done = 0;
  for (const row of rows) {
    if (DRY) {
      done++;
      continue;
    }
    const url = await upload(row.url);
    if (!url) continue;
    await db.restaurantImage.update({
      where: { id: row.id },
      // legacyPath keeps the original location, so a bad run can be reversed.
      data: { url, legacyPath: row.url },
    });
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${rows.length}`);
  }
  console.log(`restaurant_images: ${done} done`);
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
  await migrateRestaurantImages();
  await migrateSiteSettings();
  console.log("done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
