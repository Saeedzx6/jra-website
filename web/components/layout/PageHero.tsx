import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import styles from "./PageHero.module.css";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Inner-page header with breadcrumbs. Breadcrumbs appear on every page three
 * or more levels deep so a user arriving from search or a deep link can tell
 * where they are and climb back out.
 */
export function PageHero({
  eyebrow,
  title,
  lede,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  crumbs?: Crumb[];
  children?: ReactNode;
}) {
  return (
    <section className={styles.hero}>
      <div className="wrap">
        {crumbs && crumbs.length > 0 && (
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <ol>
              {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1;
                return (
                  <li key={`${crumb.label}-${index}`}>
                    {crumb.href && !last ? (
                      <Link href={crumb.href}>{crumb.label}</Link>
                    ) : (
                      <span aria-current={last ? "page" : undefined}>
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        <div className={styles.inner}>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className="display">{title}</h1>
          {lede && <p>{lede}</p>}
        </div>

        {children}
      </div>
    </section>
  );
}
