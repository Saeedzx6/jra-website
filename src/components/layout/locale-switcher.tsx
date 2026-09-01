"use client";

import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * A single link naming the *other* language in that language — "العربية" on
 * the English site, "English" on the Arabic one. The previous EN/AR pill pair
 * made the reader parse two options and work out which was current; naming the
 * destination is one word and no decision.
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();

  const other = routing.locales.find((l) => l !== locale) ?? locale;

  return (
    <button
      type="button"
      lang={other}
      onClick={() => router.replace(pathname, { locale: other })}
      aria-label={t("languageLabel")}
      suppressHydrationWarning
      className="cursor-pointer rounded-full px-2.5 py-2 text-sm font-medium text-[color:var(--nav-fg-soft,var(--color-ink-soft))] transition-colors hover:bg-[color:var(--nav-hover-bg,var(--color-surface-2))] hover:text-[color:var(--nav-fg,var(--color-ink))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--nav-focus,var(--color-accent))]"
    >
      {t("language")}
    </button>
  );
}
