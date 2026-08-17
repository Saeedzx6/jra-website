import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  updateHeroImage,
  clearHeroImage,
  updateShowcaseImage,
  clearShowcaseImage,
} from "@/lib/actions/settings";
import { getSiteSettings } from "@/lib/site-settings";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  const ts = await getTranslations("admin.settings");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{ts("title")}</h1>

      <div className="mt-6 max-w-xl rounded-2xl border border-rule bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink">{ts("heroImageTitle")}</h2>
        <p className="mt-1 text-sm text-ink-soft">{ts("heroImageDesc")}</p>

        <div className="relative mt-4 aspect-[16/7] overflow-hidden rounded-xl border border-rule bg-surface-2">
          <Image
            src={settings?.heroImageUrl ?? "/brand/jra-mark.png"}
            alt=""
            fill
            className={settings?.heroImageUrl ? "object-cover" : "object-contain p-10 opacity-40"}
          />
        </div>

        <form action={updateHeroImage} className="mt-4 flex flex-wrap items-center gap-3">
          <input
            suppressHydrationWarning
            type="file"
            name="file"
            accept="image/*"
            required
            className="text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          <button
            suppressHydrationWarning
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
          >
            {ts("upload")}
          </button>
        </form>

        {settings?.heroImageUrl ? (
          <form action={clearHeroImage} className="mt-3">
            <button suppressHydrationWarning className="text-sm text-accent hover:underline">
              {ts("resetToDefault")}
            </button>
          </form>
        ) : null}
      </div>

      {/* The two photographs overlapping the homepage hero card */}
      <div className="mt-6 max-w-3xl rounded-2xl border border-rule bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink">{ts("showcaseTitle")}</h2>
        <p className="mt-1 text-sm text-ink-soft">{ts("showcaseDesc")}</p>

        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          {(
            [
              { slot: "one", url: settings?.showcaseOneUrl, label: ts("showcaseOne") },
              { slot: "two", url: settings?.showcaseTwoUrl, label: ts("showcaseTwo") },
            ] as const
          ).map(({ slot, url, label }) => (
            <div key={slot}>
              <p className="text-sm font-semibold text-ink">{label}</p>

              <div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-xl border border-rule bg-surface-2">
                <Image
                  src={
                    url ??
                    (slot === "one"
                      ? "/brand/jra-showcase-kitchen.png"
                      : "/brand/jra-showcase-board.png")
                  }
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>

              <form action={updateShowcaseImage} className="mt-3">
                <input type="hidden" name="slot" value={slot} />
                <input
                  suppressHydrationWarning
                  type="file"
                  name="file"
                  accept="image/*"
                  required
                  className="w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                <button
                  suppressHydrationWarning
                  className="mt-3 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
                >
                  {ts("upload")}
                </button>
              </form>

              {url ? (
                <form action={clearShowcaseImage} className="mt-3">
                  <input type="hidden" name="slot" value={slot} />
                  <button suppressHydrationWarning className="text-sm text-accent hover:underline">
                    {ts("resetToDefault")}
                  </button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
