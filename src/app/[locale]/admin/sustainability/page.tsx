import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { upsertBenchmark, deleteBenchmark } from "@/lib/actions/benchmarks";

export default async function AdminSustainabilityPage() {
  const benchmarks = await db.sustainabilityBenchmark.findMany({ orderBy: { metricKey: "asc" } });
  const tn = await getTranslations("admin.nav");
  const ta = await getTranslations("admin.common");
  const ts = await getTranslations("admin.sustainability");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tn("sustainabilityBenchmarks")}</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">{ts("description")}</p>

      <form action={upsertBenchmark} className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-rule bg-surface p-4">
        <input suppressHydrationWarning name="metricKey" placeholder={ts("metricKeyPlaceholder")} required className="flex-1 min-w-[180px] rounded-lg border border-rule bg-paper px-3 py-2 text-sm" />
        <input suppressHydrationWarning name="sectorAvg" type="number" step="any" placeholder={ts("sectorAveragePlaceholder")} required className="w-40 rounded-lg border border-rule bg-paper px-3 py-2 text-sm" />
        <input suppressHydrationWarning name="unit" placeholder={ts("unitPlaceholder")} required className="w-28 rounded-lg border border-rule bg-paper px-3 py-2 text-sm" />
        <button suppressHydrationWarning className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">{ta("save")}</button>
      </form>

      <div className="mt-6 space-y-2">
        {benchmarks.map((b) => (
          <div key={b.metricKey} className="flex items-center justify-between rounded-xl border border-rule bg-surface p-4">
            <span className="text-sm text-ink">
              {b.metricKey}: <strong>{b.sectorAvg}</strong> {b.unit}
            </span>
            <form action={deleteBenchmark.bind(null, b.metricKey)}>
              <button suppressHydrationWarning className="text-xs text-accent hover:underline">{ta("remove")}</button>
            </form>
          </div>
        ))}
        {benchmarks.length === 0 && <p className="text-ink-soft">{ts("noBenchmarksYet")}</p>}
      </div>
    </div>
  );
}
