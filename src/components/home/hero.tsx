import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HeroSearch } from "@/components/home/hero-search";

/**
 * Homepage hero.
 *
 * The previous version was a white card floating over a blurred backdrop, with
 * the association described in prose and two buttons beneath it. It told you
 * JRA represents Jordan's restaurants. This one shows them: a mosaic of real
 * member photography, search as the primary action, and the cuisine strip
 * doing double duty as proof of range and as navigation.
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

  // Six tiles: a 3x2 grid on desktop collapsing to 3x1 on small screens, with
  // the first tile spanning two rows so the mosaic is not a flat checkerboard.
  const tiles = images.slice(0, 6);

  return (
    <section className="relative isolate overflow-hidden bg-[#070d14]">
      {/* Mosaic ------------------------------------------------------------ */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-px sm:grid-cols-4">
          {tiles.map((img, i) => (
            <div
              key={`${img.url}-${i}`}
              className={[
                "relative overflow-hidden",
                i === 0 ? "row-span-2" : "",
                i > 3 ? "hidden sm:block" : "",
              ].join(" ")}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="(min-width: 640px) 25vw, 34vw"
                priority={i === 0}
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Scrim. Two layers: a directional wash so the text side stays dark
            wherever the photography is bright, and a floor that blends the
            hero into the page below. Tuned so white body text clears 4.5:1
            over the brightest tile. */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070d14] via-[#070d14]/85 to-[#070d14]/45" />
        {/* Directional wash. Tailwind has no logical-direction gradient, so the
            RTL variant flips it — otherwise the dark side lands opposite the
            text in Arabic. */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070d14] via-[#070d14]/70 to-transparent rtl:bg-gradient-to-l" />
      </div>

      {/* Content ----------------------------------------------------------- */}
      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-24 sm:px-6 sm:pb-20 sm:pt-36 lg:pt-44">
        <div className="max-w-2xl">
          <p
            className="animate-editorial-rise text-xs font-semibold uppercase tracking-[0.2em] text-brass"
            style={{ animationDelay: "80ms" }}
          >
            {t("heroKicker")}
          </p>

          {/* Arabic sets the scale here: it needs the looser line-height, and
              tracking is left alone in RTL. The Latin side uses Fraunces —
              already loaded for the system and, until now, barely used. */}
          <h1
            className="animate-editorial-rise mt-5 font-editorial text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-white rtl:font-display rtl:leading-[1.3] rtl:tracking-normal"
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

          <div
            className="animate-editorial-rise mt-8 max-w-xl"
            style={{ animationDelay: "320ms" }}
          >
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
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
                    <span className="tabular text-xs text-white/45 transition-colors group-hover:text-brass">
                      {c.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </section>
  );
}
