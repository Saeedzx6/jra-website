import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FileText } from "lucide-react";
import { db } from "@/lib/db";

// Cached and revalidated every 3600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 3600;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tAbout = await getTranslations("about");

  const [board, staff, reports] = await Promise.all([
    db.person.findMany({ where: { kind: "BOARD_MEMBER" }, orderBy: { sortOrder: "asc" } }),
    db.person.findMany({ where: { kind: "STAFF" }, orderBy: { sortOrder: "asc" } }),
    db.resource.findMany({
      where: { type: "ANNUAL_REPORT", status: "PUBLISHED" },
      include: { translations: { where: { locale: locale === "ar" ? "ar" : "en" } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">{t("about")}</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">{tAbout("intro")}</p>

      {board.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold text-ink">{t("aboutBoard")}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {board.map((p) => (
              <div key={p.id} className="text-center">
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full bg-surface-2">
                  {p.photoUrl ? (
                    <Image src={p.photoUrl} alt={p.name} fill className="object-cover" />
                  ) : null}
                </div>
                <div className="mt-3 text-sm font-semibold text-ink">{p.name}</div>
                {p.positionEn ? (
                  <div className="text-xs text-ink-faint">{p.positionEn}</div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {staff.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold text-ink">{t("aboutTeam")}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {staff.map((p) => (
              <div key={p.id} className="motion-card rounded-2xl border border-rule bg-surface p-4 text-center">
                <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-surface-2">
                  {p.photoUrl ? (
                    <Image src={p.photoUrl} alt={p.name} fill className="object-cover" />
                  ) : null}
                </div>
                <div className="mt-3 text-sm font-semibold text-ink">{p.name}</div>
                {p.positionEn ? (
                  <div className="text-xs text-ink-faint">{p.positionEn}</div>
                ) : null}
                {p.email ? (
                  <div className="mt-1 text-xs text-accent">{p.email}</div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {reports.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold text-ink">{t("aboutReports")}</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {reports.map((r) => (
              <a
                key={r.id}
                href={r.fileUrl ?? "#"}
                className="motion-card flex items-center gap-3 rounded-xl border border-rule bg-surface p-4"
              >
                <FileText className="h-5 w-5 shrink-0 text-accent" />
                <span className="text-sm font-medium text-ink">
                  {r.translations[0]?.title ?? r.slug}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
