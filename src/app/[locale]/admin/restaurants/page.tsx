import { getTranslations } from "next-intl/server";
import { SubmitButton } from "@/components/admin/form-controls";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { createRestaurant } from "@/lib/actions/admin";
import { DeleteRestaurantButton } from "@/components/admin/delete-restaurant-button";
import { cx, ui } from "@/lib/ui";

export default async function AdminRestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const tn = await getTranslations("admin.nav");
  const ta = await getTranslations("admin.common");
  const tr = await getTranslations("admin.restaurants");
  const tStatus = await getTranslations("admin.restaurants.statusOptions");

  const governorates = await db.governorate.findMany({ orderBy: { nameEn: "asc" } });

  const restaurants = await db.restaurant.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    take: 50,
    include: { governorate: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className={ui.sectionTitle}>{tn("restaurants")}</h1>
      </div>
      <form className="mt-4">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder={tr("searchPlaceholder")}
          className={cx("w-full max-w-sm", ui.fieldPillOnPaper)}
        />
      </form>

      <details className={cx("mt-6", ui.panel)}>
        <summary className="cursor-pointer font-medium text-ink">{tr("newRestaurant")}</summary>
        <form action={createRestaurant} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            required
            placeholder={tr("namePlaceholder")}
            className={cx("w-full", ui.field)}
          />
          <input
            name="nameAr"
            dir="rtl"
            placeholder={tr("nameArPlaceholder")}
            className={cx("w-full", ui.field)}
          />
          <textarea
            name="shortDescription"
            rows={2}
            placeholder={tr("descriptionPlaceholder")}
            className={cx("w-full", ui.field, "sm:col-span-2")}
          />
          <input
            name="addressText"
            placeholder={tr("addressPlaceholder")}
            className={cx("w-full", ui.field)}
          />
          <select name="governorateId" defaultValue="" className={cx("w-full", ui.field)}>
            <option value="">{tr("noGovernorate")}</option>
            {governorates.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nameEn}
              </option>
            ))}
          </select>
          <input
            name="phone"
            dir="ltr"
            placeholder={tr("phonePlaceholder")}
            className={cx("w-full", ui.field)}
          />
          <input
            name="email"
            type="email"
            dir="ltr"
            placeholder={tr("emailPlaceholder")}
            className={cx("w-full", ui.field)}
          />
          <select name="status" defaultValue="DRAFT" className={cx("w-full", ui.field)}>
            <option value="DRAFT">{tStatus("DRAFT")}</option>
            <option value="PUBLISHED">{tStatus("PUBLISHED")}</option>
          </select>
          <div className="sm:col-span-2">
            <SubmitButton>{ta("create")}</SubmitButton>
            <p className="mt-2 text-xs text-ink-faint">{tr("photosAfterCreate")}</p>
          </div>
        </form>
      </details>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-rule bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3 text-start">{ta("name")}</th>
              <th className="px-4 py-3 text-start">{tr("governorate")}</th>
              <th className="px-4 py-3 text-start">{ta("status")}</th>
              <th className="px-4 py-3 text-start"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {restaurants.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium text-ink">{r.name}</td>
                <td className="px-4 py-3 text-ink-soft">{r.governorate?.nameEn ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      r.status === "PUBLISHED"
                        ? "bg-olive-soft text-olive-text"
                        : r.status === "DRAFT"
                          ? "bg-brass-soft text-brass-text"
                          : "bg-surface-2 text-ink-faint"
                    }`}
                  >
                    {tStatus(r.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/restaurants/${r.id}`} className="text-accent hover:underline">
                      {ta("edit")}
                    </Link>
                    <DeleteRestaurantButton id={r.id} name={r.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-faint">{tr("showingFirst50")}</p>
    </div>
  );
}
