import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ImageIcon, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";

/**
 * Admin site settings.
 *
 * This page used to offer a "homepage hero image" and two "showcase photos".
 * Both described the previous hero — a white card over a blurred backdrop with
 * two photographs overlapping its lower edge. That hero is gone, and the
 * uploads went nowhere: nothing on the public site ever read heroImageUrl,
 * showcaseOneUrl or showcaseTwoUrl. The only thing reading them was this page,
 * showing a preview of a file that had no effect anywhere.
 *
 * Controls that quietly do nothing are worse than absent ones, so they are
 * gone. What replaces them is the truth about where the hero imagery now comes
 * from, and a direct route to the thing that actually changes it: the primary
 * photo on each member's listing.
 */
export default async function AdminSettingsPage() {
  const ts = await getTranslations("admin.settings");

  // Exactly the query the homepage hero runs, so what is listed here is what is
  // on the corridor right now rather than an approximation of it.
  const heroImages = await db.restaurantImage.findMany({
    where: { isPrimary: true, restaurant: { status: "PUBLISHED" } },
    select: {
      url: true,
      restaurant: { select: { id: true, name: true } },
    },
    distinct: ["restaurantId"],
    take: 14,
    orderBy: { restaurantId: "asc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{ts("title")}</h1>

      <section className="mt-6 max-w-3xl rounded-2xl border border-rule bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink">{ts("heroSourceTitle")}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
          {ts("heroSourceDesc")}
        </p>

        {heroImages.length === 0 ? (
          <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-sm text-ink-soft">
            {ts("heroSourceEmpty")}
          </p>
        ) : (
          <>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
              {ts("heroSourceCurrent", { count: heroImages.length })}
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {heroImages.map((img) => (
                <li key={img.restaurant.id}>
                  <Link
                    href={`/admin/restaurants/${img.restaurant.id}`}
                    className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg border border-rule bg-surface-2">
                      <Image
                        src={img.url}
                        alt=""
                        fill
                        sizes="120px"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <span className="mt-1.5 block truncate text-xs text-ink-soft group-hover:text-accent">
                      {img.restaurant.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-6 flex items-start gap-2 rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-strong">
          <ImageIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{ts("heroSourceHowTo")}</span>
        </p>

        <Link
          href="/admin/restaurants"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {ts("heroSourceManage")}
          <ArrowRight className="h-3.5 w-3.5 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
