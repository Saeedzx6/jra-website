import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { brand, footerColumns, pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";
import { LogoLink } from "./Logo";
import styles from "./SiteFooter.module.css";

export async function SiteFooter() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("footer");
  const tBrand = await getTranslations("brand");

  return (
    <footer className={`${styles.footer} on-dark`}>
      <div className="wrap">
        <div className={styles.grid}>
          <div className={styles.brand}>
            <LogoLink variant="white" />
            <p>{tBrand("tagline")}</p>
            <address className={styles.contact}>
              <span>{pick(brand.address, locale)}</span>
              {/* dir="ltr" keeps the +962 prefix on the correct side in RTL. */}
              <a href={`tel:${brand.phone.replace(/\s/g, "")}`} dir="ltr">
                {brand.phone}
              </a>
              <a href={`mailto:${brand.email}`} dir="ltr">
                {brand.email}
              </a>
            </address>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.key} aria-labelledby={`footer-${column.key}`}>
              <h2 id={`footer-${column.key}`}>{t(column.key)}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={`${column.key}-${link.href}-${link.label.en}`}>
                    <Link href={link.href}>{pick(link.label, locale)}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className={styles.bottom}>
          <span>{t("rights", { year: new Date().getFullYear() })}</span>
          <span>{t("established")}</span>
        </div>
      </div>
    </footer>
  );
}
