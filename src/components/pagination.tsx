import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) search.set(k, v);
  }
  search.set("page", String(page));
  return `${basePath}?${search.toString()}`;
}

/** Windowed page list: 1 … current-1, current, current+1 … last */
function pageWindow(current: number, total: number): (number | "…")[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) result.push("…");
    result.push(sorted[i]!);
  }
  return result;
}

export async function Pagination({
  basePath,
  current,
  total,
  params,
}: {
  basePath: string;
  current: number;
  total: number;
  params: Record<string, string | undefined>;
}) {
  if (total <= 1) return null;
  const pages = pageWindow(current, total);
  const t = await getTranslations("common");

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label={t("pagination")}>
      <Link
        href={buildHref(basePath, params, Math.max(1, current - 1))}
        prefetch={false}
        aria-disabled={current === 1}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          current === 1
            ? "pointer-events-none text-ink-faint/40"
            : "text-ink-soft hover:bg-surface-2"
        }`}
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
      </Link>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="tabular flex h-9 w-9 items-center justify-center text-sm text-ink-faint">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(basePath, params, p)}
            prefetch={false}
            aria-current={p === current}
            className={`tabular flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
              p === current ? "bg-accent text-white" : "text-ink-soft hover:bg-surface-2"
            }`}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={buildHref(basePath, params, Math.min(total, current + 1))}
        prefetch={false}
        aria-disabled={current === total}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          current === total
            ? "pointer-events-none text-ink-faint/40"
            : "text-ink-soft hover:bg-surface-2"
        }`}
      >
        <ChevronRight className="h-4 w-4 rtl:rotate-180" />
      </Link>
    </nav>
  );
}
