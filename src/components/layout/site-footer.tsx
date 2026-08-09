import Image from "next/image";
import { useTranslations } from "next-intl";
import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { footerSitemap } from "@/lib/nav";

export function SiteFooter() {
  const t = useTranslations();
  const year = 2026;

  return (
    <footer className="mt-24 border-t border-rule bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image
              src="/brand/jra-logo.png"
              alt="Jordan Restaurant Association"
              width={162}
              height={31}
              className="h-8 w-auto"
            />
            <p className="mt-3 max-w-xs text-sm text-ink-soft">{t("footer.tagline")}</p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://www.facebook.com/JoRestaurants"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-ink-soft transition-colors hover:bg-accent hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-ink-soft transition-colors hover:bg-accent hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {t("footer.sitemap")}
            </h3>
            <ul className="mt-3 space-y-2">
              {footerSitemap.slice(0, 8).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-ink-soft hover:text-accent">
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              &nbsp;
            </h3>
            <ul className="mt-3 space-y-2">
              {footerSitemap.slice(8).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-ink-soft hover:text-accent">
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {t("nav.contact")}
            </h3>
            <ul className="mt-3 space-y-3 text-sm text-ink-soft">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span dir="ltr">+962 6 462 1558</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>info@jra.jo</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{t("footer.addressLine")}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-rule pt-6 text-xs text-ink-faint">
          © {year} Jordan Restaurant Association. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
