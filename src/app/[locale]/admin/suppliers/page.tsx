import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers";
import { SupplierPhotoManager } from "@/components/admin/supplier-photos";

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
      include: { images: { orderBy: { sortOrder: "asc" } }, governorate: true },
    }),
    db.governorate.findMany({ orderBy: { nameEn: "asc" } }),
  ]);

  const tn = await getTranslations("admin.nav");
  const ta = await getTranslations("admin.common");
  const tsup = await getTranslations("admin.suppliers");

  const field =
    "w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm focus:border-accent focus:outline-none";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tn("suppliers")}</h1>
      <p className="mt-2 text-sm text-ink-soft">{tsup("intro")}</p>

      <details className="mt-6 rounded-2xl border border-rule bg-surface p-5">
        <summary className="cursor-pointer font-medium text-ink">{tsup("newSupplier")}</summary>
        <form action={createSupplier} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            suppressHydrationWarning
            name="name"
            required
            placeholder={tsup("namePlaceholder")}
            className={field}
          />
          <input
            suppressHydrationWarning
            name="nameAr"
            dir="rtl"
            placeholder={tsup("nameArPlaceholder")}
            className={field}
          />
          <textarea
            suppressHydrationWarning
            name="shortDescription"
            rows={2}
            placeholder={tsup("descriptionPlaceholder")}
            className={`${field} sm:col-span-2`}
          />
          <input
            suppressHydrationWarning
            name="addressText"
            placeholder={tsup("addressPlaceholder")}
            className={field}
          />
          <select suppressHydrationWarning name="governorateId" defaultValue="" className={field}>
            <option value="">{tsup("noGovernorate")}</option>
            {governorates.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nameEn}
              </option>
            ))}
          </select>
          <input
            suppressHydrationWarning
            name="phone"
            dir="ltr"
            placeholder={tsup("phonePlaceholder")}
            className={field}
          />
          <input
            suppressHydrationWarning
            name="email"
            type="email"
            dir="ltr"
            placeholder={tsup("emailPlaceholder")}
            className={field}
          />
          <input
            suppressHydrationWarning
            name="website"
            type="url"
            dir="ltr"
            placeholder={tsup("websitePlaceholder")}
            className={`${field} sm:col-span-2`}
          />
          <select suppressHydrationWarning name="status" defaultValue="DRAFT" className={field}>
            <option value="DRAFT">{tsup("draft")}</option>
            <option value="PUBLISHED">{tsup("published")}</option>
          </select>
          <div className="sm:col-span-2">
            <button
              suppressHydrationWarning
              className="pill-press rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
            >
              {ta("create")}
            </button>
          </div>
        </form>
      </details>

      <div className="mt-6 space-y-4">
        {suppliers.map((s) => {
          const save = updateSupplier.bind(null, s.id);
          return (
            <div key={s.id} className="rounded-2xl border border-rule bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium text-ink">
                  {s.name}
                  {s.governorate ? (
                    <span className="ms-2 text-xs text-ink-faint">{s.governorate.nameEn}</span>
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
                <form action={save} className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    suppressHydrationWarning
                    name="name"
                    required
                    defaultValue={s.name}
                    className={field}
                  />
                  <input
                    suppressHydrationWarning
                    name="nameAr"
                    dir="rtl"
                    defaultValue={s.nameAr ?? ""}
                    className={field}
                  />
                  <textarea
                    suppressHydrationWarning
                    name="shortDescription"
                    rows={2}
                    defaultValue={s.shortDescription ?? ""}
                    className={`${field} sm:col-span-2`}
                  />
                  <input
                    suppressHydrationWarning
                    name="addressText"
                    defaultValue={s.addressText ?? ""}
                    className={field}
                  />
                  <select
                    suppressHydrationWarning
                    name="governorateId"
                    defaultValue={s.governorateId ?? ""}
                    className={field}
                  >
                    <option value="">{tsup("noGovernorate")}</option>
                    {governorates.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nameEn}
                      </option>
                    ))}
                  </select>
                  <input
                    suppressHydrationWarning
                    name="phone"
                    dir="ltr"
                    defaultValue={s.phone ?? ""}
                    className={field}
                  />
                  <input
                    suppressHydrationWarning
                    name="email"
                    type="email"
                    dir="ltr"
                    defaultValue={s.email ?? ""}
                    className={field}
                  />
                  <input
                    suppressHydrationWarning
                    name="website"
                    type="url"
                    dir="ltr"
                    defaultValue={s.website ?? ""}
                    className={`${field} sm:col-span-2`}
                  />
                  <select
                    suppressHydrationWarning
                    name="status"
                    defaultValue={s.status}
                    className={field}
                  >
                    <option value="DRAFT">{tsup("draft")}</option>
                    <option value="PUBLISHED">{tsup("published")}</option>
                  </select>
                  <div className="sm:col-span-2">
                    <button
                      suppressHydrationWarning
                      className="pill-press rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
                    >
                      {ta("save")}
                    </button>
                  </div>
                </form>
              </details>

              <div className="mt-4">
                <p className="ui-caps font-semibold text-ink-faint">{tsup("photos")}</p>
                <div className="mt-3">
                  <SupplierPhotoManager supplierId={s.id} images={s.images} />
                </div>
              </div>
            </div>
          );
        })}
        {suppliers.length === 0 ? (
          <p className="rounded-2xl border border-rule bg-surface p-5 text-sm text-ink-soft">
            {tsup("empty")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
