"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  filterEntries,
  vocab,
  type DirectoryQuery,
  type Restaurant,
  type Supplier,
} from "@/lib/directory";
import { EntryCard } from "./EntryCard";
import styles from "./DirectoryBrowser.module.css";

const PAGE_SIZE = 24;
const URL_SYNC_DELAY = 350;

type Facet = "q" | "category" | "city" | "feature";
type Filters = Record<Facet, string>;
type SortKey = "photos" | "name" | "city";

const EMPTY: Filters = { q: "", category: "", city: "", feature: "" };

/**
 * Client-side faceted browse over the static directory.
 *
 * Filter state is held locally and the URL is kept in step with
 * history.replaceState, rather than the state living in the URL and being read
 * back through the router. Three reasons:
 *
 *  1. It works. Routing every change through next-intl's router did not: that
 *     router drops a query string appended to the href, so it navigated to the
 *     same pathname, Next treated it as a no-op, and no filter ever applied.
 *  2. It is immediate. Nothing here needs the server — the whole directory is
 *     bundled — so a round-trip per keystroke bought latency and nothing else.
 *  3. Typing does not litter the history stack. Filter URLs stay shareable
 *     because the initial state comes in as a prop read on the server, and
 *     `popstate` is handled so back/forward still restores a filtered view.
 *
 * The initial filters arrive as a PROP rather than from `useSearchParams`,
 * which matters more than it looks. `useSearchParams` forces the component
 * under a Suspense boundary, and that boundary was never resolving on the
 * client: the markup streamed in, but no React fiber was ever attached to it.
 * Everything rendered and nothing responded, because the subtree was dead
 * HTML. Reading the query on the server removes the boundary entirely, so this
 * hydrates eagerly like any other client component — and a deep-linked
 * filtered URL now server-renders already filtered, with no unfiltered flash.
 */
export function DirectoryBrowser({
  entries,
  kind,
  initialFilters,
}: {
  entries: Array<Restaurant | Supplier>;
  kind: "restaurants" | "suppliers";
  initialFilters: Partial<Filters>;
}) {
  const t = useTranslations("directory");
  const tSearch = useTranslations("search");
  const id = useId();

  const supportsFeature = kind === "restaurants";

  const [filters, setFilters] = useState<Filters>(() => ({
    q: initialFilters.q ?? "",
    category: initialFilters.category ?? "",
    city: initialFilters.city ?? "",
    // A stale ?feature= on the suppliers page would filter everything out
    // with no control on screen to clear it. Ignore it there.
    feature: supportsFeature ? (initialFilters.feature ?? "") : "",
  }));
  const [shown, setShown] = useState(PAGE_SIZE);
  const [sort, setSort] = useState<SortKey>("photos");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Back/forward should restore the filtered view the user left.
  useEffect(() => {
    const onPopState = () => {
      const next = new URLSearchParams(window.location.search);
      setFilters({
        q: next.get("q") ?? "",
        category: next.get("category") ?? "",
        city: next.get("city") ?? "",
        feature: supportsFeature ? (next.get("feature") ?? "") : "",
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [supportsFeature]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function syncUrl(next: Filters, immediate: boolean) {
    clearTimeout(timer.current);
    const write = () => {
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(next)) {
        if (value) search.set(key, value);
      }
      const qs = search.toString();
      window.history.replaceState(
        null,
        "",
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
      );
    };
    // Selects settle immediately; typing is debounced so the address bar is
    // not rewritten on every keystroke.
    if (immediate) write();
    else timer.current = setTimeout(write, URL_SYNC_DELAY);
  }

  function set(facet: Facet, value: string) {
    const next = { ...filters, [facet]: value };
    setFilters(next);
    setShown(PAGE_SIZE); // a new filter set is a new list; page 3 of the old one is meaningless
    syncUrl(next, facet !== "q");
  }

  function clearAll() {
    setFilters(EMPTY);
    setShown(PAGE_SIZE);
    syncUrl(EMPTY, true);
  }

  /**
   * Default order puts photographed entries first. 219 of the 718 restaurants
   * have no usable photograph, and leaving them interleaved gives a grid
   * pocked with monogram plates — the directory reads as half-finished when it
   * is merely unevenly photographed. Alphabetical remains one click away.
   */
  const results = useMemo(() => {
    const found = filterEntries(entries, filters as DirectoryQuery);
    const byName = (a: (typeof found)[number], b: (typeof found)[number]) =>
      a.name.localeCompare(b.name);

    if (sort === "name") return [...found].sort(byName);
    if (sort === "city")
      return [...found].sort(
        (a, b) => a.city.localeCompare(b.city) || byName(a, b),
      );
    return [...found].sort(
      (a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)) || byName(a, b),
    );
  }, [entries, filters, sort]);

  /**
   * Counts for one facet's options, computed against the *other* active
   * filters — standard faceted-search behaviour. Without this a user can pick
   * a cuisine that cannot co-exist with their city and land on a dead end.
   */
  const countsFor = useCallback(
    (facet: Facet, values: readonly string[]) => {
      const base = filterEntries(entries, {
        ...filters,
        [facet]: "",
      } as DirectoryQuery);
      const counts = new Map<string, number>();
      for (const value of values) {
        counts.set(
          value,
          filterEntries(base, { [facet]: value } as DirectoryQuery).length,
        );
      }
      return counts;
    },
    [entries, filters],
  );

  const categories = supportsFeature ? vocab.cuisines : vocab.trades;
  const categoryLabel = supportsFeature ? tSearch("cuisine") : tSearch("trade");

  const categoryCounts = useMemo(
    () => countsFor("category", categories),
    [countsFor, categories],
  );
  const cityCounts = useMemo(
    () => countsFor("city", vocab.cities),
    [countsFor],
  );
  const featureCounts = useMemo(
    () => (supportsFeature ? countsFor("feature", vocab.features) : new Map()),
    [countsFor, supportsFeature],
  );

  const activeChips = (
    [
      { facet: "q" as const, label: tSearch("keyword"), value: filters.q },
      { facet: "category" as const, label: categoryLabel, value: filters.category },
      { facet: "city" as const, label: tSearch("governorate"), value: filters.city },
      ...(supportsFeature
        ? [{ facet: "feature" as const, label: tSearch("feature"), value: filters.feature }]
        : []),
    ] as Array<{ facet: Facet; label: string; value: string }>
  ).filter((chip) => chip.value);

  const hasFilters = activeChips.length > 0;

  function optionList(values: readonly string[], counts: Map<string, number>) {
    return values.map((value) => {
      const count = counts.get(value) ?? 0;
      return (
        <option key={value} value={value} disabled={count === 0}>
          {value} ({count})
        </option>
      );
    });
  }

  const filterFields = (
    <>
      <div className="field">
        <label htmlFor={`${id}-q`}>{tSearch("keyword")}</label>
        <input
          id={`${id}-q`}
          type="search"
          value={filters.q}
          placeholder={tSearch("keywordPlaceholder")}
          onChange={(event) => set("q", event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor={`${id}-cat`}>{categoryLabel}</label>
        <select
          id={`${id}-cat`}
          value={filters.category}
          onChange={(event) => set("category", event.target.value)}
        >
          <option value="">{tSearch("any")}</option>
          {optionList(categories, categoryCounts)}
        </select>
      </div>

      <div className="field">
        <label htmlFor={`${id}-city`}>{tSearch("governorate")}</label>
        <select
          id={`${id}-city`}
          value={filters.city}
          onChange={(event) => set("city", event.target.value)}
        >
          <option value="">{tSearch("any")}</option>
          {optionList(vocab.cities, cityCounts)}
        </select>
      </div>

      {supportsFeature && (
        <div className="field">
          <label htmlFor={`${id}-feature`}>{tSearch("feature")}</label>
          <select
            id={`${id}-feature`}
            value={filters.feature}
            onChange={(event) => set("feature", event.target.value)}
          >
            <option value="">{tSearch("any")}</option>
            {optionList(vocab.features, featureCounts)}
          </select>
        </div>
      )}
    </>
  );

  return (
    <div className={styles.layout}>
      {/* On small screens the panel collapses, so four controls don't push the
          results below the fold. It is open from 1040px up, where it is a
          sidebar and there is room for both. */}
      <details className={styles.filters} open>
        <summary className={styles.filtersSummary}>
          <span>{t("filters")}</span>
          {hasFilters && <span className={styles.badge}>{activeChips.length}</span>}
        </summary>

        <div className={styles.filtersBody}>
          <div className={styles.filtersHead}>
            <h2>{t("filters")}</h2>
            <button
              type="button"
              className={styles.clear}
              disabled={!hasFilters}
              onClick={clearAll}
            >
              {t("clearFilters")}
            </button>
          </div>
          {filterFields}
        </div>
      </details>

      <div>
        <div className={styles.resultsHead}>
          <div>
            <p className={styles.total} role="status" aria-live="polite">
              {t("resultsCount", { count: results.length })}
            </p>
            {results.length > 0 && (
              <p className={styles.count}>
                {t("showing", {
                  shown: Math.min(shown, results.length),
                  total: results.length,
                })}
              </p>
            )}
          </div>

          {results.length > 1 && (
            <div className={styles.sort}>
              <label htmlFor={`${id}-sort`}>{t("sortBy")}</label>
              <select
                id={`${id}-sort`}
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
              >
                <option value="photos">{t("sortRelevance")}</option>
                <option value="name">{t("sortName")}</option>
                <option value="city">{t("sortCity")}</option>
              </select>
            </div>
          )}
        </div>

        {/* Active filters are visible and individually removable, so it is
            always obvious why a list is short. */}
        {hasFilters && (
          <ul className={styles.chips}>
            {activeChips.map((chip) => (
              <li key={chip.facet}>
                <button type="button" onClick={() => set(chip.facet, "")}>
                  <span className={styles.chipLabel}>{chip.label}:</span>
                  <bdi>{chip.value}</bdi>
                  <span aria-hidden="true">×</span>
                  <span className="sr-only">{t("clearFilters")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {results.length === 0 ? (
          <div className={styles.empty}>
            <h3>{t("empty")}</h3>
            <p>{t("emptyHint")}</p>
            <button type="button" className="btn" onClick={clearAll}>
              {t("clearFilters")}
            </button>
          </div>
        ) : (
          <>
            <ul className={styles.grid}>
              {results.slice(0, shown).map((entry) => (
                <li key={entry.slug}>
                  <EntryCard entry={entry} kind={kind} />
                </li>
              ))}
            </ul>

            {shown < results.length && (
              <div className={styles.more}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShown((n) => n + PAGE_SIZE)}
                >
                  {t("loadMore")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
