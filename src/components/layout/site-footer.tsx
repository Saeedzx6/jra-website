import Image from "next/image";
import { useTranslations } from "next-intl";
import { Phone, Mail, MapPin, Facebook, Instagram, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Site footer.
 *
 * The previous version split the seventeen navigation entries with
 * `slice(0, 8)` and `slice(8)`, which put Legal beside Sustainability and left
 * the second column with `&nbsp;` where its heading should have been. Grouping
 * them by what someone is actually looking for is the difference between a
 * list and a directory.
 *
 * It also sits at the end of the page's navy-to-paper descent, so it uses the
 * lightest surface in the system deliberately — it is where the gradient
 * lands.
 */

/** Entries with a null url are not rendered. Add the real one to bring it back. */
const SOCIAL_LINKS = [
  { label: "Facebook", url: "https://www.facebook.com/JoRestaurants", Icon: Facebook },
  { label: "Instagram", url: null, Icon: Instagram },
] as const;

const COLUMNS = [
  {
    headingKey: "footer.colDirectory",
    links: [
      { labelKey: "nav.restaurants", href: "/restaurants" },
      { labelKey: "nav.suppliers", href: "/suppliers" },
      { labelKey: "nav.marketplace", href: "/marketplace" },
    ],
  },
  {
    headingKey: "footer.colMembers",
    links: [
      { labelKey: "nav.membership", href: "/membership" },
      { labelKey: "nav.classification", href: "/classification" },
      { labelKey: "nav.sustainability", href: "/sustainability" },
      { labelKey: "nav.training", href: "/training" },
    ],
  },
  {
    headingKey: "footer.colResources",
    links: [
      { labelKey: "nav.news", href: "/news" },
      { labelKey: "nav.magazine", href: "/magazine" },
      { labelKey: "nav.knowledge", href: "/knowledge" },
      { labelKey: "nav.opportunities", href: "/opportunities" },
      { labelKey: "nav.jobs", href: "/jobs" },
      { labelKey: "nav.projects", href: "/projects" },
    ],
  },
] as const;

const LEGAL_LINKS = [
  { labelKey: "nav.about", href: "/about" },
  { labelKey: "nav.legal", href: "/legal" },
  { labelKey: "nav.contact", href: "/contact" },
] as const;

export function SiteFooter() {
  const t = useTranslations();
  // Rendered on the server, so it never goes stale the way a hardcoded year does.
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-rule bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Identity, and how to actually reach them */}
          <div>
            <Image
              src="/brand/jra-logo.png"
              alt="Jordan Restaurant Association"
              width={162}
              height={31}
              className="h-9 w-auto"
            />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              {t("footer.tagline")}
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-ink-faint">
              {t("footer.established")}
            </p>

            <ul className="mt-6 space-y-3 text-sm text-ink-soft">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <a href="tel:+96264621558" className="hover:text-accent" dir="ltr">
                  +962 6 462 1558
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <a href="mailto:info@jra.jo" className="hover:text-accent" dir="ltr">
                  info@jra.jo
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span className="leading-relaxed">{t("footer.addressLine")}</span>
              </li>
            </ul>

            <div className="mt-6 flex gap-2">
              {SOCIAL_LINKS.filter((s) => s.url).map(({ label, url, Icon }) => (
                <a
                  key={label}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink-soft transition-colors hover:bg-accent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Grouped by what someone is looking for, not by list position */}
          {COLUMNS.map((col) => (
            <nav key={col.headingKey} aria-label={t(col.headingKey)}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                {t(col.headingKey)}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-ink-soft transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {t(item.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-faint">
            © {year} {t("footer.legalName")}. {t("footer.rights")}
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-xs text-ink-faint transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="https://jra.jo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-ink-faint transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                jra.jo
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
