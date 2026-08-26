import { getTranslations, setRequestLocale } from "next-intl/server";
import { Leaf, Droplet, Zap, ClipboardCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";

// Cached and revalidated every 3600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 3600;

export default async function SustainabilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const ts = await getTranslations("sustainability");

  const assessed = await db.restaurant.count({ where: { sustainabilityScore: { not: null } } });

  const pillars = [
    { icon: Zap, title: ts("pillarEnergyTitle"), desc: ts("pillarEnergyDesc") },
    { icon: Droplet, title: ts("pillarWaterTitle"), desc: ts("pillarWaterDesc") },
    { icon: Leaf, title: ts("pillarWasteTitle"), desc: ts("pillarWasteDesc") },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        {t("serviceSustainability")}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
        {ts("heroTitle")}
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">{ts("heroBody")}</p>

      <div className="mt-8">
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          <ClipboardCheck className="h-4 w-4" />
          {ts("runAssessment")}
        </Link>
        {assessed > 0 ? (
          <span className="ms-4 text-sm text-ink-faint">
            {ts("completedCount", { count: assessed })}
          </span>
        ) : null}
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {pillars.map((p) => (
          <div key={p.title} className="reveal motion-card rounded-2xl border border-rule bg-surface p-5">
            <p.icon className="h-6 w-6 text-olive-text" />
            <h3 className="mt-3 font-display text-base font-semibold text-ink">{p.title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
