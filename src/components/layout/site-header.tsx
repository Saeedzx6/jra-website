"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Menu, X, UserPlus, LogIn } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { primaryNav } from "@/lib/nav";
import { LocaleSwitcher } from "./locale-switcher";
import { HeaderSearch } from "./header-search";
import { PrimaryNav } from "./primary-nav";

/**
 * Fixed header, per design-system/MASTER.md §4a — it overlays the first
 * section rather than sitting above it, so `sticky` is wrong: sticky occupies
 * layout space and would push the hero down, leaving a paper band exactly
 * where the blend should be.
 *
 * The spec's transparent-at-rest treatment assumes every page opens on a dark
 * section. This app does not satisfy that — there is no shared page hero and
 * the inner pages start on paper — so the overlay is scoped to the home route,
 * which does have a dark hero. Everywhere else the header is solid from the
 * first paint. Give an inner page a dark opening section and it can opt in by
 * extending `overlayRoutes` below.
 *
 * Colours are not hardcoded here: the ground drives --nav-* in globals.css,
 * because brand blue is close to invisible over photography and the focus
 * ring has to stay findable on both.
 */
const overlayRoutes = ["/"];

export function SiteHeader() {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);

  const canOverlay = overlayRoutes.includes(pathname);

  useEffect(() => {
    if (!canOverlay) return;
    const onScroll = () => setStuck(window.scrollY > 64);
    // Run once on mount: a restored scroll position or a deep link means the
    // page can start below the threshold.
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [canOverlay]);

  // The mobile panel puts opaque content directly under the bar, so the
  // transparent treatment has to end while it is open.
  const overlay = canOverlay && !stuck && !open;

  return (
    <header
      data-overlay={overlay ? "true" : "false"}
      className={`site-header fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300 ${
        overlay
          ? "border-b border-transparent bg-transparent"
          : "animate-nav-drop border-b border-rule bg-paper/92 shadow-stuck backdrop-blur-md"
      }`}
    >
      {/* Utility row — brand, global search, account actions */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" onClick={() => setOpen(false)}>
          {/* Both lockups render, stacked in one grid cell and cross-faded.
              Swapping the src instead would cost a layout shift and a second
              network request at the exact moment the user scrolls. */}
          <span className="logo-stack">
            <Image
              src="/brand/jra-logo-white.png"
              alt=""
              aria-hidden
              width={162}
              height={31}
              priority
              className="logo-on-dark h-7 w-auto sm:h-8"
            />
            <Image
              src="/brand/jra-logo.png"
              alt="Jordan Restaurant Association"
              width={162}
              height={31}
              priority
              className="logo-on-light h-7 w-auto sm:h-8"
            />
          </span>
        </Link>

        {/* Actions: language, the member CTA, and the menu. The menu button
            stays visible at every width — the nav row below collapses under
            xl, and at wide widths it still reaches the sections that are not
            in the seven primary items. */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <LocaleSwitcher />

          <Link
            href="/login"
            className="btn hidden sm:inline-flex"
            style={{ minBlockSize: 44, paddingInline: "1.35rem" }}
          >
            <LogIn className="h-4 w-4" />
            {t("nav.login")}
          </Link>

          <div className="xl:hidden">
            <HeaderSearch />
          </div>

          <button
            suppressHydrationWarning
            className="icon-btn cursor-pointer text-[color:var(--nav-fg)] transition-colors hover:bg-[color:var(--nav-hover-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--nav-focus)]"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t("nav.close") : t("nav.menu")}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Centered primary navigation carrying the sliding indicator */}
      <div className="mx-auto hidden max-w-6xl justify-center px-4 sm:px-6 xl:flex">
        <PrimaryNav />
      </div>

      {open && (
        <div className="border-t border-rule bg-paper px-4 pb-4 xl:hidden">
          <nav className="flex flex-col pt-2">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-ink-soft hover:bg-surface-2 hover:text-ink"
              >
                {t(item.labelKey)}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-1.5 rounded-md px-2 py-2.5 text-sm font-medium text-ink-soft hover:text-ink"
            >
              <LogIn className="h-4 w-4" />
              {t("nav.login")}
            </Link>
            <Link
              href="/membership"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              <UserPlus className="h-4 w-4" />
              {t("nav.membership")}
            </Link>
            <div className="mt-3">
              <LocaleSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
