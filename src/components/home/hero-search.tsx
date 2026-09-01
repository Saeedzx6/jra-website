"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, ArrowRight } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

/**
 * The hero's primary action.
 *
 * On a directory, search *is* the call to action — the previous hero led with
 * two buttons and buried search behind an icon in the header. This puts it
 * where the eye lands.
 */
export function HeroSearch() {
  const t = useTranslations("home");
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/restaurants?q=${encodeURIComponent(q)}` : "/restaurants");
      }}
      // Glass over photography — the one place in the system where it earns
      // its keep, since it sits directly on hero media.
      className="group flex items-center gap-2 rounded-full border border-white/25 bg-white/12 p-1.5 ps-5 backdrop-blur-md transition-colors focus-within:border-white/50 focus-within:bg-white/18"
    >
      <Search className="h-5 w-5 shrink-0 text-white/70" aria-hidden="true" />
      <label htmlFor="hero-search" className="sr-only">
        {t("heroSearchLabel")}
      </label>
      <input
        // Form-filling extensions stamp attributes like fdprocessedid onto
        // inputs and buttons before React hydrates, which reports as a
        // mismatch the app cannot fix. The header's own search already
        // carries this for the same reason.
        suppressHydrationWarning
        id="hero-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("heroSearchPlaceholder")}
        // 16px minimum, or iOS zooms the page on focus.
        className="min-w-0 flex-1 bg-transparent py-3 text-base text-white placeholder:text-white/55 focus:outline-none"
      />
      <button
        suppressHydrationWarning
        type="submit"
        aria-label={t("heroSearchLabel")}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <ArrowRight className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
      </button>
    </form>
  );
}
