"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { putFile } from "@/lib/storage";

async function requireAdmin() {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) throw new Error("Forbidden");
  return session;
}

export async function getSiteSettings() {
  return db.siteSetting.findUnique({ where: { id: "singleton" } });
}

export async function updateHeroImage(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const stored = await putFile(file, { folder: "site", basename: "hero" });

  await db.siteSetting.upsert({
    where: { id: "singleton" },
    update: { heroImageUrl: stored.url },
    create: { id: "singleton", heroImageUrl: stored.url },
  });

  revalidatePath("/[locale]/admin/settings", "page");
  revalidatePath("/[locale]", "page");
}

/** Which of the two hero showcase slots an upload targets. */
type ShowcaseSlot = "one" | "two";

const SHOWCASE_FIELD = {
  one: "showcaseOneUrl",
  two: "showcaseTwoUrl",
} as const;

function readSlot(formData: FormData): ShowcaseSlot {
  return formData.get("slot") === "two" ? "two" : "one";
}

/**
 * Replaces one of the two photos overlapping the homepage hero card. The slot
 * travels in a hidden field so a single action can serve both forms.
 */
export async function updateShowcaseImage(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const slot = readSlot(formData);
  const stored = await putFile(file, {
    folder: "site",
    basename: `showcase-${slot}`,
  });

  const field = SHOWCASE_FIELD[slot];
  await db.siteSetting.upsert({
    where: { id: "singleton" },
    update: { [field]: stored.url },
    create: { id: "singleton", [field]: stored.url },
  });

  revalidatePath("/[locale]/admin/settings", "page");
  revalidatePath("/[locale]", "page");
}

/** Reverts a showcase slot to the bundled JRA default. */
export async function clearShowcaseImage(formData: FormData) {
  await requireAdmin();
  const field = SHOWCASE_FIELD[readSlot(formData)];
  await db.siteSetting.upsert({
    where: { id: "singleton" },
    update: { [field]: null },
    create: { id: "singleton" },
  });
  revalidatePath("/[locale]/admin/settings", "page");
  revalidatePath("/[locale]", "page");
}

export async function clearHeroImage() {
  await requireAdmin();
  await db.siteSetting.upsert({
    where: { id: "singleton" },
    update: { heroImageUrl: null },
    create: { id: "singleton", heroImageUrl: null },
  });
  revalidatePath("/[locale]/admin/settings", "page");
  revalidatePath("/[locale]", "page");
}
