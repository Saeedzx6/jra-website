"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { suggest, vocab, type Suggestion } from "@/lib/directory";
import styles from "./SearchConsole.module.css";

type Scope = "restaurants" | "suppliers";

export function SearchConsole({
  defaultScope = "restaurants",
  defaultQuery = "",
  showNote = true,
  lockScope = false,
}: {
  defaultScope?: Scope;
  defaultQuery?: string;
  showNote?: boolean;
  /** Hide the Restaurants/Suppliers switch and search only `defaultScope`. */
  lockScope?: boolean;
}) {
  const t = useTranslations("search");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const listId = useId();

  const [scope, setScope] = useState<Scope>(defaultScope);
  const [query, setQuery] = useState(defaultQuery);
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [feature, setFeature] = useState("");

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo<Suggestion[]>(() => suggest(query), [query]);

  // The category vocabulary follows the scope: cuisines for restaurants,
  // trades for suppliers. Switching scope invalidates any current selection.
  const categories = scope === "restaurants" ? vocab.cuisines : vocab.trades;

  function changeScope(next: Scope) {
    setScope(next);
    setCategory("");
  }

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  /**
   * next-intl's router drops a query string appended to the href — it resolves
   * the string as a pathname only, so `/restaurants?q=x` navigated to
   * `/restaurants` and the search silently did nothing. The object form keeps
   * pathname and query separate, which is the form that actually carries them.
   */
  function go(params: Record<string, string>) {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value) query[key] = value;
    }
    router.push({ pathname: `/${scope}`, query });
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setOpen(false);
    go({ q: query, category, city, feature });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      const active = suggestions[activeIndex];
      if (!active) return;
      event.preventDefault();
      router.push(active.href);
      setOpen(false);
    }
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <form className={styles.console} onSubmit={onSubmit} role="search">
      {/* The home page locks this to restaurants: suppliers were pulled off
          the front door and remain reachable from the nav and /suppliers,
          where this console appears unlocked. */}
      {!lockScope && (
        <fieldset className={styles.scope}>
          <legend className="sr-only">{t("legend")}</legend>
          {(["restaurants", "suppliers"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={styles.scopeBtn}
              aria-pressed={scope === value}
              onClick={() => changeScope(value)}
            >
              {tNav(value)}
            </button>
          ))}
        </fieldset>
      )}

      <div className={styles.row}>
        <div className={`${styles.field} ${styles.keywordField}`} ref={wrapRef}>
          <label htmlFor={`${listId}-q`}>{t("keyword")}</label>
          <input
            id={`${listId}-q`}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={t("keywordPlaceholder")}
            autoComplete="off"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
            }
          />

          {showPanel && (
            <ul className={styles.suggest} id={listId} role="listbox">
              {suggestions.length === 0 ? (
                <li className={styles.empty}>
                  <strong>{t("noResults")}</strong>
                  <span>{t("noResultsHint")}</span>
                </li>
              ) : (
                suggestions.map((item, index) => (
                  <li
                    key={`${item.kind}-${item.href.pathname}-${item.label}`}
                    role="none"
                  >
                    <button
                      type="button"
                      id={`${listId}-opt-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      data-active={index === activeIndex}
                      onClick={() => {
                        router.push(item.href);
                        setOpen(false);
                      }}
                    >
                      <span>{item.label}</span>
                      <small>{t(item.kind === "trade" ? "trade" : item.kind)}</small>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor={`${listId}-cat`}>
            {scope === "restaurants" ? t("cuisine") : t("trade")}
          </label>
          <select
            id={`${listId}-cat`}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">{t("any")}</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor={`${listId}-city`}>{t("governorate")}</label>
          <select
            id={`${listId}-city`}
            value={city}
            onChange={(event) => setCity(event.target.value)}
          >
            <option value="">{t("any")}</option>
            {vocab.cities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor={`${listId}-feature`}>{t("feature")}</label>
          <select
            id={`${listId}-feature`}
            value={feature}
            onChange={(event) => setFeature(event.target.value)}
          >
            <option value="">{t("any")}</option>
            {vocab.features.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className={`btn ${styles.submit}`}>
          {t("submit")}
        </button>
      </div>

      {showNote && (
        <p className={styles.note}>
          {t("indexing", {
            restaurants: vocab.totals.restaurants,
            cuisines: vocab.totals.cuisines,
            governorates: vocab.totals.governorates,
            features: vocab.totals.features,
          })}
        </p>
      )}
    </form>
  );
}
