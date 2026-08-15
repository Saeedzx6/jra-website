import { getTranslations, setRequestLocale } from "next-intl/server";
import { Boxes } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";

// Cached and revalidated every 3600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 3600;

export default async function SuppliersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const ts = await getTranslations("suppliers");

  const suppliers = await db.supplier.findMany({
    where: { status: "PUBLISHED" },
    include: { images: true, categories: { include: { category: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">{t("suppliers")}</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">{ts("description")}</p>

      {suppliers.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-rule bg-surface p-12 text-center">
          <Boxes className="mx-auto h-10 w-10 text-brass-text" strokeWidth={1.5} />
          <h2 className="mt-4 font-display text-xl font-semibold text-ink">
            {ts("emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">{ts("emptyBody")}</p>
          <Link
            href="/membership"
            className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            {ts("applyAsSupplier")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <div key={s.id} className="rounded-2xl border border-rule bg-surface p-5">
              <h3 className="font-display text-base font-semibold text-ink">
                {locale === "ar" && s.nameAr ? s.nameAr : s.name}
              </h3>
              <p className="mt-1 text-sm text-ink-soft">{s.shortDescription}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
