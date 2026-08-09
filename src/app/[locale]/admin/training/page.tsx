import { Download } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { createCourseWithSession } from "@/lib/actions/training";

export default async function AdminTrainingPage() {
  const courses = await db.course.findMany({
    include: {
      translations: { where: { locale: "en" } },
      sessions: { include: { _count: { select: { registrations: true } } } },
    },
    orderBy: { track: "asc" },
  });

  const tn = await getTranslations("admin.nav");
  const ta = await getTranslations("admin.common");
  const tt = await getTranslations("admin.training");
  const tTrack = await getTranslations("admin.training.trackOptions");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tn("trainingCourses")}</h1>

      <details className="mt-6 rounded-2xl border border-rule bg-surface p-5">
        <summary className="cursor-pointer font-medium text-ink">{tt("newCourse")}</summary>
        <form action={createCourseWithSession} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input suppressHydrationWarning name="title" required placeholder={tt("courseTitlePlaceholder")} className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
            <select suppressHydrationWarning name="track" required className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm">
              <option value="CHEFS">{tTrack("CHEFS")}</option>
              <option value="SERVICE">{tTrack("SERVICE")}</option>
              <option value="BARISTA">{tTrack("BARISTA")}</option>
              <option value="MANAGEMENT">{tTrack("MANAGEMENT")}</option>
              <option value="OTHER">{tTrack("OTHER")}</option>
            </select>
            <input suppressHydrationWarning name="startDate" type="date" required className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
            <input suppressHydrationWarning name="locationText" placeholder={tt("locationPlaceholder")} className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
            <input suppressHydrationWarning name="capacity" type="number" placeholder={tt("capacityPlaceholder")} className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
          </div>
          <textarea suppressHydrationWarning name="description" rows={3} placeholder={tt("descriptionPlaceholder")} className="w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm" />
          <button suppressHydrationWarning className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white">{ta("create")}</button>
        </form>
      </details>

      <div className="mt-6 space-y-4">
        {courses.map((c) => (
          <div key={c.id} className="rounded-2xl border border-rule bg-surface p-5">
            <p className="font-medium text-ink">
              {c.translations[0]?.title ?? c.slug} <span className="text-xs text-ink-faint">({c.track})</span>
            </p>
            {c.sessions.map((s) => (
              <div key={s.id} className="mt-2 flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                <span className="text-ink-soft">
                  {new Date(s.startDate).toLocaleDateString()} ·{" "}
                  {tt("registeredCount", { count: s._count.registrations })}
                </span>
                <a
                  href={`/api/admin/training/${s.id}/export`}
                  className="flex items-center gap-1 text-accent hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> {ta("exportCsv")}
                </a>
              </div>
            ))}
          </div>
        ))}
        {courses.length === 0 && <p className="text-ink-soft">{tt("noCoursesYet")}</p>}
      </div>
    </div>
  );
}
