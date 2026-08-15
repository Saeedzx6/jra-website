"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { navItems } from "@/lib/content";
import { routing, type Locale } from "@/i18n/routing";
import { LogoLink } from "./Logo";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  const t = useTranslations("nav");
  const brandName = useTranslations("brand")("name");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const [stuck, setStuck] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Far enough down that the swap reads as deliberate rather than as a flicker
  // on the first scroll nudge, but still well inside the hero.
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 64);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the panel on route change so a tapped link doesn't leave it open.
  // Adjusted during render rather than in an effect: an effect would paint the
  // new page once with the menu still covering it before closing it.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setNavOpen(false);
  }

  // While the panel is open: lock the page behind it, close on Escape, and
  // send focus into the panel. Focus returns to the toggle on close, so a
  // keyboard user is never dropped at the top of the document.
  useEffect(() => {
    if (!navOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNavOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [navOpen]);

  const other = routing.locales.find((l) => l !== locale) as Locale;

  function switchLocale() {
    router.replace(pathname, { locale: other });
  }

  const isCurrent = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <>
      <a className="skip-link" href="#main">
        {t("skipToContent")}
      </a>

      <header className={`${styles.header} ${stuck ? styles.stuck : ""}`}>
        <div className={`wrap ${styles.inner}`}>
          <Link href="/" className={styles.wordmark} aria-label={brandName}>
            {/* Both lockups render; CSS cross-fades between them. alt="" on
                each because the link itself carries the accessible name. */}
            <Image
              src="/brand/logo-white.png"
              alt=""
              width={324}
              height={61}
              priority
              className={styles.logoOnDark}
            />
            <Image
              src="/brand/logo.png"
              alt=""
              width={324}
              height={61}
              priority
              className={styles.logoOnLight}
            />
          </Link>

          <nav className={styles.nav} aria-label={t("menu")}>
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isCurrent(item.href) ? "page" : undefined}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={switchLocale}
              className={styles.langToggle}
              lang={other}
              aria-label={t("languageLabel")}
            >
              {t("language")}
            </button>

            <Link href="/login" className={`btn ${styles.loginBtn}`}>
              {t("login")}
            </Link>

            <button
              ref={toggleRef}
              type="button"
              className={`icon-btn ${styles.navToggle}`}
              aria-expanded={navOpen}
              aria-controls="mobile-nav"
              aria-label={navOpen ? t("close") : t("menu")}
              onClick={() => setNavOpen((open) => !open)}
            >
              <MenuIcon open={navOpen} />
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-nav"
        ref={panelRef}
        className={styles.mobileNav}
        hidden={!navOpen}
      >
        <div className={styles.mobileNavHead}>
          <LogoLink variant="white" className={styles.wordmark} />
          <button
            type="button"
            className="icon-btn"
            aria-label={t("close")}
            onClick={() => {
              setNavOpen(false);
              toggleRef.current?.focus();
            }}
          >
            <MenuIcon open />
          </button>
        </div>

        <nav aria-label={t("menu")}>
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isCurrent(item.href) ? "page" : undefined}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className={styles.mobileNavFoot}>
          <Link href="/login" className="btn btn-light">
            {t("login")}
          </Link>
        </div>
      </div>
    </>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M3 6h18M3 12h18M3 18h18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
