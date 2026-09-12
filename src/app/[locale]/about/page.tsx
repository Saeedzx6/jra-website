import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FileText, Download, Mail, PlayCircle } from "lucide-react";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/page-metadata";
import { AboutCarousel } from "@/components/about/about-carousel";
import { CountUp } from "@/components/count-up";
import { toVideoEmbed } from "@/lib/video-embed";

// Cached and revalidated every 3600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 3600;

export const generateMetadata = pageMetadata("/about", "about");

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ar = locale === "ar";
  const t = await getTranslations("nav");
  const tAbout = await getTranslations("about");

  const [board, staff, reports, slides, settings, restaurantCount, governorates] =
    await Promise.all([
      db.person.findMany({ where: { kind: "BOARD_MEMBER" }, orderBy: { sortOrder: "asc" } }),
      db.person.findMany({ where: { kind: "STAFF" }, orderBy: { sortOrder: "asc" } }),
      db.resource.findMany({
        where: { type: "ANNUAL_REPORT", status: "PUBLISHED" },
        include: { translations: { where: { locale: ar ? "ar" : "en" } } },
        orderBy: { createdAt: "desc" },
      }),
      db.aboutSlide.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      db.siteSetting.findUnique({ where: { id: "singleton" }, select: { aboutVideoUrl: true } }),
      db.restaurant.count({ where: { status: "PUBLISHED" } }),
      db.restaurant.findMany({
        where: { status: "PUBLISHED", governorateId: { not: null } },
        distinct: ["governorateId"],
        select: { governorateId: true },
      }),
    ]);

  const video = toVideoEmbed(settings?.aboutVideoUrl);

  /**
   * Position in the reader's language. This page showed `positionEn` to
   * everyone, so an Arabic reader got Arabic names above English job titles.
   */
  const position = (p: { positionEn: string | null; positionAr: string | null }) =>
    (ar && p.positionAr) || p.positionEn;

  const stats = [
    { value: new Date().getFullYear() - 2002, label: tAbout("statYears") },
    { value: restaurantCount, label: tAbout("statClassified") },
    { value: governorates.length, label: tAbout("statGovernorates") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <p className="ui-caps font-semibold text-accent">{tAbout("kicker")}</p>
        <h1 className="mt-2 font-display font-semibold text-5xl text-ink">{t("about")}</h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">{tAbout("intro")}</p>
      </header>

      {/* The carousel leads. A page about an association of 1,300 members that
          opens with a wall of text is not describing the same organisation the
          photographs do. */}
      {slides.length > 0 ? (
        <div className="mt-10">
          <AboutCarousel
            slides={slides.map((s) => ({
              id: s.id,
              imageUrl: s.imageUrl,
              caption: (ar && s.captionAr) || s.captionEn || null,
            }))}
          />
        </div>
      ) : null}

      {/* Real numbers, computed rather than typed. The old jra.jo shipped four
          counters all reading zero. */}
      <section className="mt-14 grid gap-6 border-y border-rule py-10 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display text-4xl font-semibold text-accent">
              <CountUp value={s.value} />
            </div>
            <div className="mt-1 text-sm text-ink-soft">{s.label}</div>
          </div>
        ))}
      </section>

      {video ? (
        <section className="mt-14">
          <h2 className="flex items-center gap-2 font-display font-semibold text-2xl text-ink">
            <PlayCircle className="h-5 w-5 text-accent" aria-hidden="true" />
            {tAbout("videoTitle")}
          </h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-rule bg-surface-2">
            {/* Lazy: the page should not fetch a player nobody scrolled to. */}
            <iframe
              src={video.src}
              title={tAbout("videoTitle")}
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="aspect-video w-full border-0"
            />
          </div>
        </section>
      ) : null}

      {board.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display font-semibold text-2xl text-ink">{t("aboutBoard")}</h2>
          <div className="stagger mt-8 grid gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {board.map((p) => (
              <div key={p.id} className="group text-center">
                <div className="zoom-frame relative mx-auto h-24 w-24 overflow-hidden rounded-full border border-rule bg-surface-2">
                  {p.photoUrl ? (
                    <Image
                      src={p.photoUrl}
                      alt=""
                      fill
                      sizes="96px"
                      className="motion-card-image object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center font-display text-2xl text-ink/25">
                      {p.name.trim().charAt(0)}
                    </span>
                  )}
                </div>
                <div className="mt-3 text-sm font-semibold text-ink">{p.name}</div>
                {position(p) ? (
                  <div className="text-xs leading-snug text-ink-faint">{position(p)}</div>
                ) : null}
                {p.termLabel ? (
                  <div className="mt-1 text-[11px] text-ink-faint">{p.termLabel}</div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {staff.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display font-semibold text-2xl text-ink">{t("aboutTeam")}</h2>
          <div className="stagger mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {staff.map((p) => (
              <div
                key={p.id}
                className="motion-card group rounded-2xl border border-rule bg-surface p-6 text-center"
              >
                <div className="zoom-frame relative mx-auto h-20 w-20 overflow-hidden rounded-full border border-rule bg-surface-2">
                  {p.photoUrl ? (
                    <Image
                      src={p.photoUrl}
                      alt=""
                      fill
                      sizes="80px"
                      className="motion-card-image object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center font-display text-xl text-ink/25">
                      {p.name.trim().charAt(0)}
                    </span>
                  )}
                </div>
                <div className="mt-4 text-sm font-semibold text-ink">{p.name}</div>
                {position(p) ? (
                  <div className="mt-0.5 text-xs leading-snug text-ink-faint">{position(p)}</div>
                ) : null}
                {p.email ? (
                  <a
                    href={`mailto:${p.email}`}
                    dir="ltr"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent transition-colors hover:text-accent-strong"
                  >
                    <Mail className="h-3 w-3" aria-hidden="true" />
                    {p.email}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {reports.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display font-semibold text-2xl text-ink">{t("aboutReports")}</h2>
          <div className="stagger mt-8 grid gap-4 sm:grid-cols-2">
            {reports.map((r) => (
              <a
                key={r.id}
                href={r.fileUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="motion-card group flex items-center gap-4 rounded-2xl border border-rule bg-surface p-6"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium text-ink">
                  {r.translations[0]?.title ?? r.slug}
                </span>
                <Download
                  className="h-4 w-4 shrink-0 text-ink-faint transition-colors group-hover:text-accent"
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
