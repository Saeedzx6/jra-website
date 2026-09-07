import { getTranslations } from "next-intl/server";
import { ArrowUpRight, Briefcase, CalendarDays, Megaphone } from "lucide-react";

/**
 * The three things JRA points members at that live outside this site.
 *
 * The old jra.jo carried these as a rotating banner carousel, a black
 * stock-photo strip and a Petra hero band — three unrelated visual registers
 * stacked on top of each other. They are the same three destinations here, but
 * as one row of editorial cards in the site's own language: hairline border,
 * 40px radius, no shadow, the accent used once.
 *
 * Each is an outbound link, so each says so — an icon that moves on hover and
 * a `rel` that does not leak the referrer's session.
 */

const LINKS = [
  {
    key: "jobs",
    href: "https://siyahajobs.jo",
    Icon: Briefcase,
  },
  {
    key: "events",
    href: "https://calendar.jo",
    Icon: CalendarDays,
  },
  {
    key: "advertise",
    // Not an outbound site: advertising enquiries go to the association's own
    // line, which is the number the old banner printed as plain text.
    href: "tel:+96264621558",
    Icon: Megaphone,
  },
] as const;

export async function PartnerStrip() {
  const t = await getTranslations("home.partners");

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="font-display text-4xl text-ink">{t("title")}</h2>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">{t("intro")}</p>

      <div className="stagger mt-10 grid gap-6 md:grid-cols-3">
        {LINKS.map(({ key, href, Icon }) => {
          const external = href.startsWith("http");
          return (
            <a
              key={key}
              href={href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="motion-card group flex flex-col rounded-2xl border border-rule bg-surface p-6 sm:p-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Icon className="h-6 w-6 text-accent" strokeWidth={1.75} aria-hidden="true" />
              <h3 className="mt-5 font-display text-2xl text-ink">{t(`${key}.title`)}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
                {t(`${key}.body`)}
              </p>
              <span className="ui-caps mt-6 inline-flex items-center gap-1.5 font-semibold text-accent">
                {t(`${key}.cta`)}
                {/* Rises on hover rather than sliding sideways: this one points
                    out of the site, and "away" has no reading direction to
                    mirror under RTL. */}
                <ArrowUpRight
                  className="cta-arrow h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </span>
              {external ? <span className="sr-only">{t("opensInNewTab")}</span> : null}
            </a>
          );
        })}
      </div>
    </section>
  );
}
