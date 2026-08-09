"use server";

import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { putFile, usingCloudinary } from "@/lib/storage";
import slugifyLib from "slugify";

async function requireAdmin() {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) throw new Error("Forbidden");
  return session;
}

async function writeAudit(
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  diff?: unknown
) {
  await db.auditLog.create({
    data: { actorUserId, action, entityType, entityId, diff: diff as never },
  });
}

// --- Restaurants -----------------------------------------------------------

export async function updateRestaurant(id: string, formData: FormData) {
  const session = await requireAdmin();
  const data = {
    name: String(formData.get("name") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    status: formData.get("status") as "DRAFT" | "PUBLISHED" | "ARCHIVED",
  };

  await db.restaurant.update({ where: { id }, data });
  await writeAudit(session.user.id, "UPDATE", "RESTAURANT", id, data);
  revalidatePath("/[locale]/admin/restaurants", "page");
  revalidatePath("/[locale]/admin/restaurants/[id]", "page");
}

export async function deleteRestaurant(id: string) {
  const session = await requireAdmin();
  const restaurant = await db.restaurant.findUnique({ where: { id }, select: { name: true, slug: true } });
  if (!restaurant) return;

  // Local dev keeps photos on disk, so clear the folder alongside the DB rows.
  // With Cloudinary there is no local folder to remove; the CDN objects are
  // left in place deliberately, since deleting a listing should not be able to
  // destroy assets that a restore might still need.
  if (!usingCloudinary) {
    const dir = path.join(process.cwd(), "public", "uploads", "restaurants", restaurant.slug);
    fs.rmSync(dir, { recursive: true, force: true });
  }

  await db.restaurant.delete({ where: { id } });
  await writeAudit(session.user.id, "DELETE", "RESTAURANT", id, { name: restaurant.name });

  revalidatePath("/[locale]/admin/restaurants", "page");
  revalidatePath("/[locale]/restaurants", "page");
  revalidatePath("/[locale]", "page");
}

// --- Restaurant photos ---------------------------------------------------

export async function uploadRestaurantImage(restaurantId: string, formData: FormData) {
  const session = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw new Error("Restaurant not found");

  const stored = await putFile(file, {
    folder: `restaurants/${restaurant.slug}`,
    basename: "admin",
  });

  const existingCount = await db.restaurantImage.count({ where: { restaurantId } });

  await db.restaurantImage.create({
    data: {
      restaurantId,
      url: stored.url,
      isPrimary: existingCount === 0,
      sortOrder: existingCount,
    },
  });

  await writeAudit(session.user.id, "UPLOAD_IMAGE", "RESTAURANT", restaurantId, {
    url: stored.url,
  });
  revalidatePath("/[locale]/admin/restaurants/[id]", "page");
}

export async function deleteRestaurantImage(imageId: string) {
  const session = await requireAdmin();
  const image = await db.restaurantImage.findUnique({ where: { id: imageId } });
  if (!image) return;

  await db.restaurantImage.delete({ where: { id: imageId } });

  if (image.isPrimary) {
    const next = await db.restaurantImage.findFirst({
      where: { restaurantId: image.restaurantId },
      orderBy: { sortOrder: "asc" },
    });
    if (next) await db.restaurantImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }

  await writeAudit(session.user.id, "DELETE_IMAGE", "RESTAURANT", image.restaurantId, { imageId });
  revalidatePath("/[locale]/admin/restaurants/[id]", "page");
}

export async function setPrimaryRestaurantImage(restaurantId: string, imageId: string) {
  const session = await requireAdmin();
  await db.restaurantImage.updateMany({
    where: { restaurantId },
    data: { isPrimary: false },
  });
  await db.restaurantImage.update({ where: { id: imageId }, data: { isPrimary: true } });
  await writeAudit(session.user.id, "SET_PRIMARY_IMAGE", "RESTAURANT", restaurantId, { imageId });
  revalidatePath("/[locale]/admin/restaurants/[id]", "page");
}

// --- News --------------------------------------------------------------

export async function upsertNewsArticle(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const title = String(formData.get("title") ?? "");
  const bodyHtml = String(formData.get("bodyHtml") ?? "");
  const status = formData.get("status") as "DRAFT" | "PUBLISHED";

  if (id) {
    await db.newsArticle.update({ where: { id }, data: { status } });
    await db.newsTranslation.upsert({
      where: { newsArticleId_locale: { newsArticleId: id, locale: "en" } },
      update: { title, bodyHtml },
      create: { newsArticleId: id, locale: "en", title, bodyHtml },
    });
    await writeAudit(session.user.id, "UPDATE", "NEWS_ARTICLE", id, { title, status });
  } else {
    const slug = `${slugifyLib(title, { lower: true, strict: true })}-${Date.now().toString(36)}`;
    const created = await db.newsArticle.create({
      data: {
        slug,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        authorId: session.user.id,
        translations: { create: { locale: "en", title, bodyHtml } },
      },
    });
    await writeAudit(session.user.id, "CREATE", "NEWS_ARTICLE", created.id, { title, status });
  }

  revalidatePath("/[locale]/admin/news", "page");
}

// --- Contact inquiries ---------------------------------------------------

export async function markInquiryHandled(id: string) {
  const session = await requireAdmin();
  await db.contactInquiry.update({ where: { id }, data: { status: "HANDLED" } });
  await writeAudit(session.user.id, "UPDATE", "CONTACT_INQUIRY", id, { status: "HANDLED" });
  revalidatePath("/[locale]/admin/contact", "page");
}

// --- Membership applications --------------------------------------------

export async function approveMembershipApplication(id: string) {
  const session = await requireAdmin();
  const application = await db.membershipApplication.findUnique({ where: { id } });
  if (!application) throw new Error("Not found");

  const email = application.email.toLowerCase();
  const tempPassword = Math.random().toString(36).slice(2, 10);
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const role = application.applicantType === "ACTIVE_RESTAURANT" ? "RESTAURANT_MEMBER" : "SUPPLIER_MEMBER";

  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, fullName: application.contactName, role },
  });

  // Approval is the actual moment JRA accepts this business as a member —
  // it should appear in the public directory and count in site stats
  // immediately, not sit hidden as a draft waiting for a second manual
  // "publish" step nobody was told about.
  if (application.applicantType === "ACTIVE_RESTAURANT") {
    const slug = slugifyLib(application.businessName, { lower: true, strict: true });
    const restaurant = await db.restaurant.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: application.businessName,
        phone: application.phone,
        email,
        status: "PUBLISHED",
        source: "MEMBER_SUBMITTED",
        governorateId: application.governorateId,
      },
    });
    await db.businessManager.upsert({
      where: { id: `app-${application.id}` },
      update: {},
      create: { id: `app-${application.id}`, userId: user.id, restaurantId: restaurant.id },
    });
  } else {
    const slug = slugifyLib(application.businessName, { lower: true, strict: true });
    const supplier = await db.supplier.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: application.businessName,
        phone: application.phone,
        email,
        status: "PUBLISHED",
        source: "MEMBER_SUBMITTED",
      },
    });
    await db.businessManager.upsert({
      where: { id: `app-${application.id}` },
      update: {},
      create: { id: `app-${application.id}`, userId: user.id, supplierId: supplier.id },
    });
  }

  await db.membershipApplication.update({
    where: { id },
    data: { status: "APPROVED", reviewedById: session.user.id, reviewedAt: new Date() },
  });
  await writeAudit(session.user.id, "APPROVE", "MEMBERSHIP_APPLICATION", id, { tempPassword, email });

  revalidatePath("/[locale]/admin/membership", "page");
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/restaurants", "page");
  revalidatePath("/[locale]/suppliers", "page");
  return { email, tempPassword };
}

export async function rejectMembershipApplication(id: string) {
  const session = await requireAdmin();
  await db.membershipApplication.update({
    where: { id },
    data: { status: "REJECTED", reviewedById: session.user.id, reviewedAt: new Date() },
  });
  await writeAudit(session.user.id, "REJECT", "MEMBERSHIP_APPLICATION", id);
  revalidatePath("/[locale]/admin/membership", "page");
}

// --- Generic change-request moderation ----------------------------------

const APPLIERS: Record<string, (entityId: string, payload: Record<string, unknown>) => Promise<void>> = {
  RESTAURANT: async (entityId, payload) => {
    await db.restaurant.update({ where: { id: entityId }, data: payload as never });
  },
  SUPPLIER: async (entityId, payload) => {
    await db.supplier.update({ where: { id: entityId }, data: payload as never });
  },
  MARKETPLACE_LISTING: async (entityId, payload) => {
    await db.marketplaceListing.update({ where: { id: entityId }, data: payload as never });
  },
};

export async function approveChangeRequest(id: string) {
  const session = await requireAdmin();
  const cr = await db.changeRequest.findUnique({ where: { id } });
  if (!cr || cr.status !== "PENDING") throw new Error("Not actionable");

  if (cr.action === "UPDATE" && cr.entityId) {
    const applier = APPLIERS[cr.entityType];
    if (applier) await applier(cr.entityId, cr.payload as Record<string, unknown>);
  }

  await db.changeRequest.update({
    where: { id },
    data: { status: "APPROVED", reviewedById: session.user.id, reviewedAt: new Date() },
  });
  await writeAudit(session.user.id, "APPROVE", cr.entityType, cr.entityId ?? "n/a", cr.payload);
  revalidatePath("/[locale]/admin/change-requests", "page");
}

export async function rejectChangeRequest(id: string, note?: string) {
  const session = await requireAdmin();
  await db.changeRequest.update({
    where: { id },
    data: { status: "REJECTED", reviewedById: session.user.id, reviewedAt: new Date(), reviewNote: note },
  });
  await writeAudit(session.user.id, "REJECT", "CHANGE_REQUEST", id);
  revalidatePath("/[locale]/admin/change-requests", "page");
}

export async function submitProfileEditRequest(
  restaurantId: string,
  userId: string,
  payload: Record<string, unknown>
) {
  await db.changeRequest.create({
    data: {
      entityType: "RESTAURANT",
      entityId: restaurantId,
      action: "UPDATE",
      payload: payload as never,
      submittedById: userId,
      status: "PENDING",
    },
  });
  revalidatePath("/[locale]/portal", "page");
}
