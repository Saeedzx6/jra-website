import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays, MapPin, GraduationCap } from "lucide-react";
import { db } from "@/lib/db";
import { CourseRegisterForm } from "@/components/training/register-form";

// Cached and revalidated every 3600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 3600;

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const tt = await getTranslations("training");

  const courses = await db.course.findMany({
    where: { status: "PUBLISHED" },
    include: {
      translations: { where: { locale: locale === "ar" ? "ar" : "en" } },
      sessions: { where: { startDate: { gte: new Date() } }, orderBy: { startDate: "asc" } },
    },
    orderBy: { track: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">{t("training")}</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">{tt("description")}</p>

      {courses.length === 0 ? (
        <p className="mt-16 text-center text-ink-soft">{tCommon("noResults")}</p>
      ) : (
        <div className="mt-8 space-y-4">
          {courses.map((c) => {
            const tr = c.translations[0];
            return (
              <div key={c.id} className="reveal rounded-2xl border border-rule bg-surface p-6">
                <div className="flex items-center gap-2 text-brass-text">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">{c.track}</span>
                </div>
                <h2 className="mt-2 font-display text-lg font-semibold text-ink">
                  {tr?.title ?? c.slug}
                </h2>
                {tr?.descriptionHtml ? (
                  <p className="mt-1 text-sm text-ink-soft">{tr.descriptionHtml}</p>
                ) : null}
                {c.sessions.map((s) => (
                  <div key={s.id} className="mt-4 rounded-xl border border-rule bg-surface-2 p-4">
                    <div className="flex flex-wrap gap-4 text-sm text-ink-soft">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 text-accent" />
                        {new Date(s.startDate).toLocaleDateString(locale)}
                      </span>
                      {s.locationText ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-accent" />
                          {s.locationText}
                        </span>
                      ) : null}
                    </div>
                    <CourseRegisterForm sessionId={s.id} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
