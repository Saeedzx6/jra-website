import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ORG } from "@/lib/organisation";

/**
 * The URLs live in `ORG.social` because the same list is emitted as schema.org
 * `sameAs`; only the icon pairing is a footer concern.
 *
 * LinkedIn is stored as the company root rather than the /posts/?feedView=all
 * URL it was supplied as -- that suffix is LinkedIn's own view state, not part
 * of the page's address, and it does not survive their redirects.
 */
const SOCIAL_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
} as const;

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
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-rule bg-surface text-ink">
      {/* Decorative subtle accent top border line */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-40" />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          
          {/* Identity & Contact Info */}
          <div className="flex flex-col justify-between">
            <div>
              <Link href="/" className="inline-block transition-opacity hover:opacity-90">
                <Image
                  src={ORG.brand.logo}
                  alt={t("common.associationName")}
                  width={162}
                  height={31}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </Link>
              
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
                {t("footer.tagline")}
              </p>
              
              <span className="pill-press mt-3 inline-block rounded-full bg-accent-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
                {t("footer.established")}
              </span>

              {/* Direct Contact Details */}
              <ul className="mt-6 space-y-3 text-sm text-ink-soft">
                <li>
                  <a 
                    href={ORG.phone.href} 
                    className="group flex items-center gap-3 transition-colors hover:text-accent" 
                    dir="ltr"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                      <Phone className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="font-medium">{ORG.phone.display}</span>
                  </a>
                </li>
                <li>
                  <a 
                    href={ORG.emailHref} 
                    className="group flex items-center gap-3 transition-colors hover:text-accent" 
                    dir="ltr"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                      <Mail className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="font-medium">{ORG.email}</span>
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-accent">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-xs leading-relaxed">{t("footer.addressLine")}</span>
                </li>
              </ul>
            </div>

            {/* Social Icons */}
            <div className="mt-8 flex gap-3">
              {ORG.social.map(({ key, label, url }) => {
                const Icon = SOCIAL_ICONS[key];
                return (
                  <a
                    key={key}
                    href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lift flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink-soft transition-colors hover:bg-accent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  aria-label={label}
                >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Navigation Directory Columns */}
          {COLUMNS.map((col) => (
            <nav key={col.headingKey} aria-label={t(col.headingKey)}>
              <h3 className="ui-caps font-semibold text-ink">
                {t(col.headingKey)}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group inline-flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <span>{t(item.labelKey)}</span>
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom Bar / Copyright */}
        <div className="mt-16 flex flex-col gap-4 border-t border-rule pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-faint">
            © {year} {t("footer.legalName")}. {t("footer.rights")}
          </p>
          
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
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
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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