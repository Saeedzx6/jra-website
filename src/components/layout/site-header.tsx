"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Menu, X, UserPlus, LogIn } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { primaryNav } from "@/lib/nav";
import { LocaleSwitcher } from "./locale-switcher";
import { HeaderSearch } from "./header-search";
import { PrimaryNav } from "./primary-nav";

export function SiteHeader() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <header className="animate-nav-drop sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-md">
      {/* Utility row — brand, global search, account actions */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" onClick={() => setOpen(false)}>
          <Image
            src="/brand/jra-logo.png"
            alt="Jordan Restaurant Association"
            width={162}
            height={31}
            priority
            className="h-7 w-auto sm:h-8"
          />
        </Link>

        <div className="hidden shrink-0 items-center gap-2.5 xl:flex">
          <LocaleSwitcher />
          <Link
            href="/login"
            className="lift flex cursor-pointer items-center gap-1.5 rounded-full border border-rule px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-accent/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <LogIn className="h-4 w-4" />
            {t("nav.login")}
          </Link>
          <Link
            href="/membership"
            className="lift flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <UserPlus className="h-4 w-4" />
            {t("nav.membership")}
          </Link>
        </div>

        <div className="flex items-center gap-1 xl:hidden">
          <HeaderSearch />
          <button
            suppressHydrationWarning
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
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
