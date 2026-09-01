import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { footerColumns, brand } from "@/lib/footer-nav";
import styles from "./site-footer.module.css";

export async function SiteFooter() {
  const locale = await getLocale();
  const ar = locale === "ar";
  const t = await getTranslations("footer");
  const tBrand = await getTranslations("brand");

  return (
    <footer className={`${styles.footer} on-dark`}>
      <div className="wrap">
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href="/" aria-label={tBrand("name")}>
              <Image
                src="/brand/jra-logo-white.png"
                alt=""
                width={324}
                height={61}
                sizes="220px"
              />
            </Link>
            <p>{tBrand("tagline")}</p>
            <address className={styles.contact}>
              <span>{ar ? brand.address.ar : brand.address.en}</span>
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
                  <li key={`${column.key}-${link.href}-${link.en}`}>
                    <Link href={link.href}>{ar ? link.ar : link.en}</Link>
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
