import { Download } from "lucide-react";
import { SubmitButton } from "@/components/admin/form-controls";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { createCourseWithSession } from "@/lib/actions/training";
import { cx, ui } from "@/lib/ui";

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
  const tmedia = await getTranslations("admin.media");

  return (
    <div>
      <h1 className={ui.sectionTitle}>{tn("trainingCourses")}</h1>

      <details className={cx("mt-6", ui.panel)}>
        <summary className="cursor-pointer font-medium text-ink">{tt("newCourse")}</summary>
        <form action={createCourseWithSession} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="title" required placeholder={tt("courseTitlePlaceholder")} className={ui.field} />
            <select name="track" required className={ui.field}>
              <option value="CHEFS">{tTrack("CHEFS")}</option>
              <option value="SERVICE">{tTrack("SERVICE")}</option>
              <option value="BARISTA">{tTrack("BARISTA")}</option>
              <option value="MANAGEMENT">{tTrack("MANAGEMENT")}</option>
              <option value="OTHER">{tTrack("OTHER")}</option>
            </select>
            <input name="startDate" type="date" required className={ui.field} />
            <input name="locationText" placeholder={tt("locationPlaceholder")} className={ui.field} />
            <input name="capacity" type="number" placeholder={tt("capacityPlaceholder")} className={ui.field} />
          </div>
          <textarea name="description" rows={3} placeholder={tt("descriptionPlaceholder")} className={cx("w-full", ui.field)} />
          <SubmitButton>{ta("create")}</SubmitButton>
        </form>
      </details>

      <div className="mt-6 space-y-4">
        {courses.map((c) => (
          <div key={c.id} className={ui.panel}>
            <p className="font-medium text-ink">
              {c.translations[0]?.title ?? c.slug} <span className="text-xs text-ink-faint">({c.track})</span>
            </p>

            <div className="mt-3">
              <CoverImageField
                target="course"
                id={c.id}
                currentUrl={c.coverImageUrl}
                label={tmedia("coverImage")}
                hint={tmedia("coverHintWide")}
              />
            </div>
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
