import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { AboutManager } from "@/components/admin/about-manager";

/**
 * The About page's carousel and video.
 *
 * Both are content that changes whenever the board sits for a photograph or
 * JRA publishes a film, so both belong here rather than in a commit.
 */
export default async function AdminAboutPage() {
  const [slides, settings] = await Promise.all([
    db.aboutSlide.findMany({ orderBy: { sortOrder: "asc" } }),
    db.siteSetting.findUnique({ where: { id: "singleton" }, select: { aboutVideoUrl: true } }),
  ]);

  const tn = await getTranslations("admin.nav");
  const t = await getTranslations("admin.about");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tn("aboutPage")}</h1>
      <p className="mt-2 text-sm text-ink-soft">{t("intro")}</p>

      <div className="mt-6">
        <AboutManager slides={slides} videoUrl={settings?.aboutVideoUrl ?? null} />
      </div>
    </div>
  );
}
