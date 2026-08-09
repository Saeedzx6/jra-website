"use client";

import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/navigation";

type Governorate = { slug: string; nameEn: string; nameAr: string | null };
type Cuisine = { slug: string; nameEn: string; nameAr: string | null };

export function DirectoryFilters({
  governorates,
  cuisines,
  current,
}: {
  governorates: Governorate[];
  cuisines: Cuisine[];
  current: { q?: string; governorate?: string; cuisine?: string };
}) {
  const t = useTranslations("common");
  const tr = useTranslations("restaurants");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function update(key: string, value: string) {
    const params = new URLSearchParams(current as Record<string, string>);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form
      className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-rule bg-surface p-4"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input suppressHydrationWarning
          type="search"
          defaultValue={current.q ?? ""}
          placeholder={t("search")}
          onChange={(e) => {
            const value = e.currentTarget.value;
            clearTimeout((window as unknown as { __q?: ReturnType<typeof setTimeout> }).__q);
            (window as unknown as { __q?: ReturnType<typeof setTimeout> }).__q = setTimeout(
              () => update("q", value),
              400
            );
          }}
          className="w-full rounded-full border border-rule bg-paper py-2 ps-9 pe-4 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      <select suppressHydrationWarning
        defaultValue={current.governorate ?? ""}
        onChange={(e) => update("governorate", e.target.value)}
        className="rounded-full border border-rule bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none"
      >
        <option value="">{tr("allGovernorates")}</option>
        {governorates.map((g) => (
          <option key={g.slug} value={g.slug}>
            {locale === "ar" && g.nameAr ? g.nameAr : g.nameEn}
          </option>
        ))}
      </select>

      <select suppressHydrationWarning
        defaultValue={current.cuisine ?? ""}
        onChange={(e) => update("cuisine", e.target.value)}
        className="rounded-full border border-rule bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none"
      >
        <option value="">{tr("allCuisines")}</option>
        {cuisines.map((c) => (
          <option key={c.slug} value={c.slug}>
            {locale === "ar" && c.nameAr ? c.nameAr : c.nameEn}
          </option>
        ))}
      </select>
    </form>
  );
}
