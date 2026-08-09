"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 text-sm">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => router.replace(pathname, { locale: loc })}
          aria-current={loc === locale}
          suppressHydrationWarning
          className={`rounded-full px-2.5 py-1 uppercase tracking-wide transition-colors ${
            loc === locale
              ? "bg-accent text-white"
              : "text-ink-soft hover:bg-surface-2"
          }`}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
