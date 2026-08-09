"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/rbac";
import { requireRole } from "@/lib/rbac";

const schema = z.object({
  category: z.enum([
    "RESTAURANT_FOR_SALE",
    "EQUIPMENT_SALE",
    "EQUIPMENT_RENT",
    "INVESTMENT_OPPORTUNITY",
  ]),
  title: z.string().min(3),
  descriptionHtml: z.string().min(10),
  price: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
});

export async function createMarketplaceListing(
  _prevState: { ok: boolean; error?: string },
  formData: FormData
) {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: "unauthorized" };

  const parsed = schema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    descriptionHtml: formData.get("descriptionHtml"),
    price: formData.get("price") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    contactEmail: formData.get("contactEmail") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  await db.marketplaceListing.create({
    data: {
      category: parsed.data.category,
      title: parsed.data.title,
      descriptionHtml: parsed.data.descriptionHtml,
      price: parsed.data.price ? Number(parsed.data.price) : null,
      contactPhone: parsed.data.contactPhone,
      contactEmail: parsed.data.contactEmail,
      postedById: session.user.id,
      status: "PENDING",
    },
  });

  revalidatePath("/[locale]/portal/marketplace", "page");
  return { ok: true };
}

export async function setListingStatus(
  id: string,
  status: "PUBLISHED" | "REJECTED" | "EXPIRED"
) {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) throw new Error("Forbidden");
  await db.marketplaceListing.update({ where: { id }, data: { status } });
  await db.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "UPDATE_STATUS",
      entityType: "MARKETPLACE_LISTING",
      entityId: id,
      diff: { status },
    },
  });
  revalidatePath("/[locale]/admin/marketplace", "page");
  revalidatePath("/[locale]/marketplace", "page");
}
