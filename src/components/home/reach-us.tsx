import { getTranslations } from "next-intl/server";
import { MapPin, Phone, Mail, ArrowUpRight } from "lucide-react";

/**
 * Where JRA actually is.
 *
 * The old site put a live Google map here. This keeps the map but does not pay
 * for it on every homepage visit: the iframe is lazy, so it is only fetched
 * once the reader scrolls near it. Before that the section costs nothing.
 *
 * The address, phone and email are the same strings the footer and the contact
 * page use, and the same ones in the Organization/LocalBusiness JSON-LD. Three
 * copies of an address that disagree is a ranking signal against the site, so
 * they all read from the one `footer` namespace.
 *
 * `q=` uses the written address rather than coordinates: JRA has never
 * supplied a lat/lng, and a wrong pin is worse than a searched one.
 */
const MAP_QUERY = "Jordan Restaurant Association, Jabal Amman, Amman, Jordan";

export async function ReachUs() {
  const t = await getTranslations("home.reachUs");
  const tf = await getTranslations("footer");

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;
  const embed = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;

  return (
    <section className="border-t border-rule">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:items-center">
        <div>
          <h2 className="font-display font-semibold text-4xl text-ink">{t("title")}</h2>
          <p className="mt-3 max-w-md leading-relaxed text-ink-soft">{t("intro")}</p>

          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-accent">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="leading-relaxed text-ink-soft">{tf("addressLine")}</span>
            </li>
            <li>
              <a
                href="tel:+96264621558"
                dir="ltr"
                className="group flex items-center gap-3 text-ink-soft transition-colors hover:text-accent"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-medium">+962 6 462 1558</span>
              </a>
            </li>
            <li>
              <a
                href="mailto:info@jra.jo"
                dir="ltr"
                className="group flex items-center gap-3 text-ink-soft transition-colors hover:text-accent"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-medium">info@jra.jo</span>
              </a>
            </li>
          </ul>

          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="pill-press ui-caps mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-white"
          >
            {t("directions")}
            <ArrowUpRight className="cta-arrow h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="overflow-hidden rounded-2xl border border-rule bg-surface-2">
          <iframe
            src={embed}
            title={t("mapTitle")}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[360px] w-full border-0"
          />
        </div>
      </div>
    </section>
  );
}
