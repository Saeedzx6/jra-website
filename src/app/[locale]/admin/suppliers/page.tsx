import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { SupplierPhotoManager } from "@/components/admin/supplier-photos";
import {
  SupplierCreateForm,
  SupplierEditForm,
  type SupplierLabels,
} from "@/components/admin/supplier-form";

/**
 * Supplier back office.
 *
 * There was no admin surface for suppliers at all — a Supplier record could
 * only appear as a side effect of approving a membership application, so the
 * associate-member directory could never be curated or given photos.
 *
 * Draft is the default on creation: a supplier with no description and no
 * photo should not appear in the public directory the moment it is typed in.
 */
export default async function AdminSuppliersPage() {
  const [suppliers, governorates] = await Promise.all([
    db.supplier.findMany({
      orderBy: { name: "asc" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        governorate: true,
        membership: { select: { memberNumber: true } },
      },
    }),
    db.governorate.findMany({ orderBy: { nameEn: "asc" }, select: { id: true, nameEn: true } }),
  ]);

  const tn = await getTranslations("admin.nav");
  const ta = await getTranslations("admin.common");
  const tsup = await getTranslations("admin.suppliers");

  const labels: SupplierLabels = {
    namePlaceholder: tsup("namePlaceholder"),
    nameArPlaceholder: tsup("nameArPlaceholder"),
    descriptionPlaceholder: tsup("descriptionPlaceholder"),
    addressPlaceholder: tsup("addressPlaceholder"),
    noGovernorate: tsup("noGovernorate"),
    phonePlaceholder: tsup("phonePlaceholder"),
    emailPlaceholder: tsup("emailPlaceholder"),
    websitePlaceholder: tsup("websitePlaceholder"),
    draft: tsup("draft"),
    published: tsup("published"),
    create: ta("create"),
    save: ta("save"),
    remove: tsup("remove"),
    confirmRemove: tsup("confirmRemove"),
    cancel: tsup("cancel"),
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tn("suppliers")}</h1>
      <p className="mt-2 text-sm text-ink-soft">{tsup("intro")}</p>

      <details className="mt-6 rounded-2xl border border-rule bg-surface p-5">
        <summary className="cursor-pointer font-medium text-ink">{tsup("newSupplier")}</summary>
        <SupplierCreateForm governorates={governorates} labels={labels} />
      </details>

      <div className="mt-6 space-y-4">
        {suppliers.map((s) => (
          <div key={s.id} className="rounded-2xl border border-rule bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-ink">
                {s.name}
                {s.governorate ? (
                  <span className="ms-2 text-xs text-ink-faint">{s.governorate.nameEn}</span>
                ) : null}
                {/* Surfaced here because it is the reason a delete will be
                    refused — better to see it before trying than after. */}
                {s.membership ? (
                  <span className="ms-2 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                    {s.membership.memberNumber}
                  </span>
                ) : null}
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  s.status === "PUBLISHED"
                    ? "bg-olive-soft text-olive-text"
                    : "bg-brass-soft text-brass-text"
                }`}
              >
                {s.status === "PUBLISHED" ? tsup("published") : tsup("draft")}
              </span>
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-accent">{ta("edit")}</summary>
              <SupplierEditForm
                supplier={{
                  id: s.id,
                  name: s.name,
                  nameAr: s.nameAr,
                  shortDescription: s.shortDescription,
                  addressText: s.addressText,
                  phone: s.phone,
                  email: s.email,
                  website: s.website,
                  governorateId: s.governorateId,
                  status: s.status,
                }}
                governorates={governorates}
                labels={labels}
              />
            </details>

            <div className="mt-4">
              <p className="ui-caps font-semibold text-ink-faint">{tsup("photos")}</p>
              <div className="mt-3">
                <SupplierPhotoManager supplierId={s.id} images={s.images} />
              </div>
            </div>
          </div>
        ))}
        {suppliers.length === 0 ? (
          <p className="rounded-2xl border border-rule bg-surface p-5 text-sm text-ink-soft">
            {tsup("empty")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
