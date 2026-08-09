"use server";

import path from "node:path";
import { z } from "zod";
import { db } from "@/lib/db";
import { putFile } from "@/lib/storage";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const schema = z.object({
  applicantType: z.enum(["ACTIVE_RESTAURANT", "ASSOCIATE_SUPPLIER"]),
  businessName: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  classificationClaim: z.string().optional(),
});

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB per file
const ALLOWED_EXT = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx"]);

/**
 * Applicant paperwork is uploaded as `private`, so the stored value is an
 * app-internal route rather than a CDN link. Anyone without an admin session
 * gets a 403 instead of the document.
 */
async function saveUploadedFiles(files: File[]): Promise<string[]> {
  const real = files.filter((f) => f instanceof File && f.size > 0);
  if (real.length === 0) return [];

  const urls: string[] = [];
  for (const file of real) {
    if (file.size > MAX_FILE_BYTES) continue;
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) continue;

    const stored = await putFile(file, {
      folder: "membership-documents",
      basename: Math.random().toString(36).slice(2, 8),
      visibility: "private",
    });
    urls.push(stored.url);
  }
  return urls;
}

export async function submitMembershipApplication(
  _prevState: { ok: boolean; error?: string },
  formData: FormData
) {
  const limited = rateLimit(await clientKey("membership"), {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return { ok: false, error: "rate_limited" };
  }

  const parsed = schema.safeParse({
    applicantType: formData.get("applicantType"),
    businessName: formData.get("businessName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    classificationClaim: formData.get("classificationClaim") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  const files = formData.getAll("documents").filter((v): v is File => v instanceof File);
  const fileUrls = await saveUploadedFiles(files);

  // Optionally carries a self-assessment result along (see the "submit for
  // review" step on the public classification checklist) — stored as
  // structured JSON rather than free text so the admin review screen can
  // render a real breakdown instead of a blob of prose.
  let assessment: unknown = undefined;
  const assessmentRaw = formData.get("assessmentPayload");
  if (typeof assessmentRaw === "string" && assessmentRaw) {
    try {
      assessment = JSON.parse(assessmentRaw);
    } catch {
      assessment = undefined;
    }
  }

  const documents =
    fileUrls.length > 0 || assessment
      ? { files: fileUrls, ...(assessment ? { assessment } : {}) }
      : undefined;

  await db.membershipApplication.create({
    data: { ...parsed.data, documents: documents as never },
  });
  return { ok: true };
}
