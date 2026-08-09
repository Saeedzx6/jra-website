/**
 * Single entry point for every file upload in the app.
 *
 * Production writes to Cloudinary. Local dev, where the Cloudinary vars are
 * blank, falls back to `public/uploads` so the app still works offline — the
 * same fallback the seed scripts already rely on.
 *
 * Why this exists: server actions used to call fs.writeFileSync directly, which
 * breaks on serverless hosts (read-only filesystem) and silently loses files on
 * every redeploy elsewhere. Applicant documents were also landing in `public/`,
 * i.e. readable by anyone holding the URL.
 */

import fs from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const API_KEY = process.env.CLOUDINARY_API_KEY ?? "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";

/** True when all three Cloudinary vars are present. */
export const usingCloudinary = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

if (usingCloudinary) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
}

/**
 * `public`  — served straight from the CDN (restaurant photos, hero images).
 * `private` — never publicly addressable; reachable only through a short-lived
 *             signed URL minted for a logged-in admin (applicant documents).
 */
export type Visibility = "public" | "private";

export type StoredFile = {
  /** What to persist in the database. */
  url: string;
  /** Cloudinary public_id, or null on the local-disk fallback. */
  publicId: string | null;
};

function safeExt(filename: string, fallback = ".jpg") {
  const ext = path.extname(filename).toLowerCase();
  return ext || fallback;
}

/** Strips anything that could escape the intended folder. */
function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^-+|-+$/g, "") || "file";
}

async function saveToDisk(
  buffer: Buffer,
  folder: string,
  filename: string
): Promise<StoredFile> {
  const destDir = path.join(process.cwd(), "public", "uploads", ...folder.split("/"));
  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, filename), buffer);
  return { url: `/uploads/${folder}/${filename}`, publicId: null };
}

/**
 * Uploads a file and returns the value to store in the database.
 *
 * For `private` files the returned url is an app route, not a CDN link — see
 * `src/app/api/documents/[...publicId]/route.ts`, which checks the session
 * before redirecting to a signed Cloudinary URL that expires in minutes.
 */
export async function putFile(
  file: File,
  opts: { folder: string; basename: string; visibility?: Visibility }
): Promise<StoredFile> {
  const visibility = opts.visibility ?? "public";
  const ext = safeExt(file.name);
  const filename = `${safeSegment(opts.basename)}-${Date.now()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!usingCloudinary) {
    return saveToDisk(buffer, opts.folder, filename);
  }

  const isImage = /\.(png|jpe?g|webp|gif|avif)$/i.test(ext);

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          // The full path goes in public_id rather than the `folder` option:
          // under Cloudinary's "dynamic folders" mode `folder` only sets a
          // display folder and does NOT prefix the public_id, which would
          // break the `jra/` check in the private-document route.
          public_id: `jra/${opts.folder}/${filename.replace(ext, "")}`,
          // PDFs and Office docs must go up as `raw`; Cloudinary rejects them
          // under the default `image` resource type.
          resource_type: isImage ? "image" : "raw",
          // `authenticated` keeps the asset off the public CDN path — it can
          // only be fetched with a signature we generate server-side.
          type: visibility === "private" ? "authenticated" : "upload",
          overwrite: false,
        },
        (error, res) => {
          if (error || !res) reject(error ?? new Error("Upload failed"));
          else resolve({ secure_url: res.secure_url, public_id: res.public_id });
        }
      );
      stream.end(buffer);
    }
  );

  if (visibility === "private") {
    return {
      url: `/api/documents/${encodeURIComponent(result.public_id)}`,
      publicId: result.public_id,
    };
  }

  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Mints a signed, expiring URL for a private asset. Callers must have already
 * verified the session — this function does no authorization of its own.
 */
export function signPrivateUrl(publicId: string, ttlSeconds = 300) {
  if (!usingCloudinary) return `/${publicId}`;
  return cloudinary.url(publicId, {
    type: "authenticated",
    sign_url: true,
    secure: true,
    expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
  });
}

/** Best-effort delete. Never throws — cleanup must not fail a user action. */
export async function deleteFile(publicId: string | null, url?: string) {
  try {
    if (usingCloudinary && publicId) {
      await cloudinary.uploader.destroy(publicId);
      return;
    }
    if (!usingCloudinary && url?.startsWith("/uploads/")) {
      const abs = path.join(process.cwd(), "public", url);
      fs.rmSync(abs, { force: true });
    }
  } catch {
    // A stale CDN object is not worth breaking the request over.
  }
}
