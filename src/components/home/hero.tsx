import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HeroSearch } from "@/components/home/hero-search";
import { ImageStreamHero } from "@/components/ui/image-stream-hero";

/**
 * Homepage hero.
 *
 * The previous version was a white card floating over a blurred backdrop, with
 * the association described in prose and two buttons beneath it. It told you
 * JRA represents Jordan's restaurants. This shows them: a corridor of real
 * member photography running toward the viewer, search as the primary action,
 * and the cuisine strip doing double duty as proof of range and as navigation.
 *
 * Dark ground on purpose — food photography reads better against it, and it
 * gives the page a distinct opening register before settling into the light
 * editorial layout below.
 *
 * Governorates were the first candidate for the strip, but three of them hold
 * no restaurants and 288 listings have none assigned, so it would have
 * advertised the gap rather than the reach. Cuisine covers 78% and spreads
 * properly.
 */

export type HeroCuisine = { slug: string; label: string; count: number };

/**
 * The corridor renders plain <img> rather than next/image, so nothing resizes
 * these for us. Eighteen full-resolution restaurant photos would be several
 * megabytes on first paint; the cards are ~18% of the container's width, so a
 * 420px derivative is already more than enough. Cloudinary does the work in
 * the URL. Non-Cloudinary sources (local dev uploads) pass through untouched.
 */
function thumb(url: string): string {
  const marker = "/image/upload/";
  const at = url.indexOf(marker);
  if (at === -1) return url;
  const head = url.slice(0, at + marker.length);
  const tail = url.slice(at + marker.length);
  return `${head}w_420,h_560,c_fill,g_auto,q_auto,f_auto/${tail}`;
}

export async function HomeHero({
  images,
  cuisines,
  restaurantCount,
}: {
  images: { url: string; alt: string }[];
  cuisines: HeroCuisine[];
  restaurantCount: number;
}) {
  const t = await getTranslations("home");

  const stream = images.map((i) => ({ src: thumb(i.url), alt: i.alt }));

  return (
    <ImageStreamHero
      images={stream}
      // Seven per rail rather than the default nine: these are photographs of
      // real venues, and a denser corridor turns them into texture.
      cards={7}
      speed={26}
      axis={48}
      className="bg-[#173156]"
    >
      {/* Scrim. A floor that settles the corridor into the ground, and a
          directional wash keeping the text side dark wherever the photography
          runs bright. The ground is a brand-derived navy rather than near
          black, and lighter again after the first pass read heavy — white body copy
          still measures 13.0:1 on it, and the faintest tier 5.5:1, but it reads as
          a colour rather than an absence of one. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#173156] via-[#173156]/80 to-[#173156]/40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#173156] via-[#173156]/75 to-transparent rtl:bg-gradient-to-l"
      />
      {/* No bottom fade here any more. The page wraps the hero and the
          services grid in one container that owns the whole navy-to-paper
          transition, so a second fade at the hero's edge would have punched
          a light band into the middle of it. */}

      {/* Top padding is measured against the fixed header rather than guessed,
          because the section above pulls this whole block up underneath it. */}
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-[calc(var(--header-h)+2rem)] sm:px-6 sm:pb-20 sm:pt-[calc(var(--header-h)+5rem)] lg:pt-[calc(var(--header-h)+7rem)]">
        <div className="max-w-2xl">
          {/* Tracking and casing come from --eyebrow-*, not from utilities:
              positive tracking renders cursive Arabic as disconnected glyphs,
              and uppercase silently shouts any Latin inside an Arabic run.
              The kicker used to be brass, which is now fenced to
              classification and sustainability — this is decorative use. */}
          <p
            className="animate-editorial-rise font-eyebrow text-xs font-semibold text-[color:var(--blue-300)]"
            style={{ animationDelay: "80ms" }}
          >
            {t("heroKicker")}
          </p>

          {/* Arabic sets the scale here: it needs the looser line-height.
              Style and tracking come from the display tokens, which the
              [dir="rtl"] block neutralises — so no rtl: overrides needed. */}
          <h1
            className="animate-editorial-rise mt-5 font-display text-[clamp(2.4rem,6vw,4.5rem)] leading-[1.08] text-white rtl:leading-[1.3]"
            style={{ animationDelay: "160ms" }}
          >
            {t("heroTitle")}
          </h1>

          <p
            className="animate-editorial-rise mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg"
            style={{ animationDelay: "240ms" }}
          >
            {t("heroSubtitle")}
          </p>

          <div className="animate-editorial-rise mt-8 max-w-xl" style={{ animationDelay: "320ms" }}>
            <HeroSearch />
            <p className="mt-3 text-sm text-white/55">
              {t("heroSearchHint", { count: restaurantCount })}
            </p>
          </div>
        </div>

        {/* Cuisine strip — the structural device. Real counts, and every item
            is a working filter rather than decoration. */}
        {cuisines.length > 0 ? (
          <nav
            aria-label={t("browseByCuisine")}
            className="animate-editorial-rise mt-12 border-t border-white/15 pt-6 sm:mt-16"
            style={{ animationDelay: "400ms" }}
          >
            <p className="font-eyebrow text-xs font-semibold text-white/45">
              {t("browseByCuisine")}
            </p>
            {/* gap-x only: the vertical rhythm comes from each link's own
                padding, which is what lifts the hit area to 44px without
                spacing the row out visually. */}
            <ul className="mt-1 flex flex-wrap gap-x-6">
              {cuisines.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/restaurants?cuisine=${c.slug}`}
                    className="group inline-flex min-h-11 items-center gap-2 py-3 text-white/80 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                  >
                    <span className="text-sm font-medium">{c.label}</span>
                    <span className="tabular text-xs text-white/45 transition-colors group-hover:text-white">
                      {c.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </ImageStreamHero>
  );
}
