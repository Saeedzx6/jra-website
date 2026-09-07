"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { putFile } from "@/lib/storage";
import { requireAdmin, writeAudit } from "@/lib/rbac";

/**
 * Board members and staff — the people shown on /about.
 *
 * Fourteen records exist and all fourteen have photos, but they arrived from
 * a seed script: there has never been a way to add a board member after an
 * election, correct a job title, or replace a headshot. Every term change
 * meant a developer and a deploy.
 *
 * `kind` is validated against the enum rather than trusted, because it decides
 * which of the two lists on the About page a person appears in.
 */

const KINDS = ["BOARD_MEMBER", "STAFF"] as const;
type PersonKind = (typeof KINDS)[number];

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

function revalidatePeople() {
  revalidatePath("/[locale]/admin/people", "page");
  revalidatePath("/[locale]/about", "page");
}

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : null;
}

function kindOf(formData: FormData): PersonKind {
  const raw = formData.get("kind");
  return KINDS.includes(raw as PersonKind) ? (raw as PersonKind) : "STAFF";
}

export async function createPerson(formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const name = str(formData, "name");
  // The field is `required` in the markup, so a missing name here means a
  // hand-built request rather than a mistake anyone made in the UI.
  if (!name) throw new Error("A name is required.");

  const sortOrder = Number(formData.get("sortOrder"));

  const person = await db.person.create({
    data: {
      name,
      kind: kindOf(formData),
      positionEn: str(formData, "positionEn"),
      positionAr: str(formData, "positionAr"),
      email: str(formData, "email"),
      termLabel: str(formData, "termLabel"),
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  });

  await writeAudit(session.user.id, "CREATE", "PERSON", person.id, { name });
  revalidatePeople();
}

export async function updatePerson(id: string, formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const name = str(formData, "name");
  if (!name) throw new Error("A name is required.");

  const sortOrder = Number(formData.get("sortOrder"));

  await db.person.update({
    where: { id },
    data: {
      name,
      kind: kindOf(formData),
      positionEn: str(formData, "positionEn"),
      positionAr: str(formData, "positionAr"),
      email: str(formData, "email"),
      termLabel: str(formData, "termLabel"),
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  });

  await writeAudit(session.user.id, "UPDATE", "PERSON", id, { name });
  revalidatePeople();
}

export async function deletePerson(id: string): Promise<void> {
  const session = await requireAdmin();
  const person = await db.person.findUnique({ where: { id } });
  if (!person) return;

  await db.person.delete({ where: { id } });
  await writeAudit(session.user.id, "DELETE", "PERSON", id, { name: person.name });
  revalidatePeople();
}

export async function setPersonPhoto(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image first." };
  if (!ALLOWED.includes(file.type)) {
    return { error: "That file is not an image. Use JPEG, PNG, WebP, AVIF or GIF." };
  }
  if (file.size > MAX_BYTES) return { error: "That image is larger than 8 MB." };

  const person = await db.person.findUnique({ where: { id } });
  if (!person) return { error: "Person not found." };

  const stored = await putFile(file, { folder: "people", basename: "person" });
  await db.person.update({ where: { id }, data: { photoUrl: stored.url } });

  await writeAudit(session.user.id, "UPLOAD_IMAGE", "PERSON", id, { url: stored.url });
  revalidatePeople();
  return {};
}

export async function clearPersonPhoto(id: string): Promise<{ error?: string }> {
  const session = await requireAdmin();
  await db.person.update({ where: { id }, data: { photoUrl: null } });
  await writeAudit(session.user.id, "DELETE_IMAGE", "PERSON", id, {});
  revalidatePeople();
  return {};
}
