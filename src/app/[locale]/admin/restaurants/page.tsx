import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { DeleteRestaurantButton } from "@/components/admin/delete-restaurant-button";

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

  const restaurants = await db.restaurant.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    take: 50,
    include: { governorate: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">{tn("restaurants")}</h1>
      </div>
      <form className="mt-4">
        <input suppressHydrationWarning
          name="q"
          defaultValue={q ?? ""}
          placeholder={tr("searchPlaceholder")}
          className="w-full max-w-sm rounded-full border border-rule bg-surface px-4 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </form>

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
