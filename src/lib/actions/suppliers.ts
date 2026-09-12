"use server";

import { revalidatePath } from "next/cache";
import slugifyLib from "slugify";
import { db } from "@/lib/db";
import { putFile } from "@/lib/storage";
import { requireAdmin, writeAudit } from "@/lib/rbac";
import { ok, fail, type ActionState } from "@/lib/action-state";
// One ceiling shared with the browser-side resizer, so the message a user
// sees and the limit the server enforces cannot drift apart.
import { UPLOAD_MAX_BYTES as MAX_BYTES } from "@/lib/prepare-image";

/**
 * Supplier back office.
 *
 * Until now a Supplier record could only come into existence as a side effect
 * of approving a membership application — there was no admin surface at all,
 * so the associate-member directory could never be curated directly. These
 * actions back `admin/suppliers`.
 *
 * Photos mirror the restaurant gallery rather than the single-cover model:
 * SupplierImage is a many-row table with `isPrimary`, and the directory card
 * reads the first image.
 */


const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];


function revalidateSuppliers() {
  revalidatePath("/[locale]/admin/suppliers", "page");
  revalidatePath("/[locale]/suppliers", "page");
  revalidatePath("/[locale]", "page");
}

/** Appends a numeric suffix rather than failing on a duplicate name. */
async function uniqueSlug(name: string) {
  const base = slugifyLib(name, { lower: true, strict: true }) || "supplier";
  let slug = base;
  for (let n = 2; await db.supplier.findUnique({ where: { slug } }); n++) {
    slug = `${base}-${n}`;
  }
  return slug;
}

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : null;
}

export async function createSupplier(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();

  const name = str(formData, "name");
  if (!name) return fail("A supplier name is required.");

  const status = formData.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const governorateId = str(formData, "governorateId");

  const supplier = await db.supplier.create({
    data: {
      slug: await uniqueSlug(name),
      name,
      nameAr: str(formData, "nameAr"),
      shortDescription: str(formData, "shortDescription"),
      addressText: str(formData, "addressText"),
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      website: str(formData, "website"),
      governorateId,
      status,
      source: "ADMIN_CREATED",
    },
  });

  await writeAudit(session.user.id, "CREATE", "SUPPLIER", supplier.id, { name, status });
  revalidateSuppliers();
  return ok(`${name} added.`);
}

export async function updateSupplier(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();

  const name = str(formData, "name");
  if (!name) return fail("A supplier name is required.");

  await db.supplier.update({
    where: { id },
    data: {
      name,
      nameAr: str(formData, "nameAr"),
      shortDescription: str(formData, "shortDescription"),
      addressText: str(formData, "addressText"),
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      website: str(formData, "website"),
      governorateId: str(formData, "governorateId"),
      status: formData.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    },
  });

  await writeAudit(session.user.id, "UPDATE", "SUPPLIER", id, { name });
  revalidateSuppliers();
  return ok("Changes saved.");
}

export async function uploadSupplierImage(
  supplierId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image first." };
  if (!ALLOWED.includes(file.type)) {
    return { error: "That file is not an image. Use JPEG, PNG, WebP, AVIF or GIF." };
  }
  if (file.size > MAX_BYTES) return { error: "That image is too large even after resizing. Please crop it or save a smaller copy." };

  const supplier = await db.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) return { error: "Supplier not found." };

  const stored = await putFile(file, {
    folder: `suppliers/${supplier.slug}`,
    basename: "admin",
  });

  const existing = await db.supplierImage.count({ where: { supplierId } });
  await db.supplierImage.create({
    data: {
      supplierId,
      url: stored.url,
      // The first photo uploaded becomes the one the directory card shows.
      isPrimary: existing === 0,
      sortOrder: existing,
    },
  });

  await writeAudit(session.user.id, "UPLOAD_IMAGE", "SUPPLIER", supplierId, { url: stored.url });
  revalidateSuppliers();
  return {};
}

export async function deleteSupplierImage(imageId: string) {
  const session = await requireAdmin();
  const image = await db.supplierImage.findUnique({ where: { id: imageId } });
  if (!image) return;

  await db.supplierImage.delete({ where: { id: imageId } });

  // Deleting the primary would leave the card with no image even though others
  // remain, so promote the next one in order.
  if (image.isPrimary) {
    const next = await db.supplierImage.findFirst({
      where: { supplierId: image.supplierId },
      orderBy: { sortOrder: "asc" },
    });
    if (next) await db.supplierImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }

  await writeAudit(session.user.id, "DELETE_IMAGE", "SUPPLIER", image.supplierId, { imageId });
  revalidateSuppliers();
}

export async function setPrimarySupplierImage(supplierId: string, imageId: string) {
  const session = await requireAdmin();
  await db.supplierImage.updateMany({ where: { supplierId }, data: { isPrimary: false } });
  await db.supplierImage.update({ where: { id: imageId }, data: { isPrimary: true } });
  await writeAudit(session.user.id, "SET_PRIMARY_IMAGE", "SUPPLIER", supplierId, { imageId });
  revalidateSuppliers();
}

/**
 * Deletes a supplier.
 *
 * Images, category links and manager links all cascade. A Membership does not:
 * its `supplierId` is `SetNull`, so deleting a supplier that has one would
 * leave a membership — and every invoice and payment hanging off it — pointing
 * at nothing, with no way to tell afterwards who it belonged to.
 *
 * Rather than silently strand billing history, this refuses and explains. The
 * way to take such a supplier off the site is to set it back to Draft, which
 * removes it from the public directory and keeps the record intact.
 */
export async function deleteSupplier(
  id: string,
  _prev: ActionState
): Promise<ActionState> {
  const session = await requireAdmin();

  const supplier = await db.supplier.findUnique({
    where: { id },
    select: { name: true, membership: { select: { id: true, memberNumber: true } } },
  });
  if (!supplier) return fail("That supplier no longer exists.");

  if (supplier.membership) {
    return fail(
      `${supplier.name} holds membership ${supplier.membership.memberNumber} with billing history, so it cannot be deleted. Set it to Draft instead to remove it from the public directory.`
    );
  }

  await db.supplier.delete({ where: { id } });
  await writeAudit(session.user.id, "DELETE", "SUPPLIER", id, { name: supplier.name });
  revalidateSuppliers();
  return ok(`${supplier.name} deleted.`);
}
