"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { DirectoryVocab, Suggestion } from "@/lib/directory-vocab";
import styles from "./search-console.module.css";

/**
 * The working search console from design-system/MASTER.md — the hero's
 * payload, not an ornament beneath it. This is a directory product, so
 * finding a listing is the primary task and the search bar is the CTA.
 *
 * Ported from the design-system implementation, which read a static JSON
 * vocabulary. Here the vocabulary is queried from the database and handed in
 * as a prop, so the options are whatever the directory actually contains.
 */
export function SearchConsole({
  vocab,
  defaultQuery = "",
  showNote = true,
}: {
  vocab: DirectoryVocab;
  defaultQuery?: string;
  showNote?: boolean;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const listId = useId();

  const [query, setQuery] = useState(defaultQuery);
  const [cuisine, setCuisine] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [feature, setFeature] = useState("");

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    // Prefix matches first — someone typing "haش" wants the listings that
    // start that way, not the ones that happen to contain it midway.
    const starts: Suggestion[] = [];
    const contains: Suggestion[] = [];
    for (const item of vocab.suggestions) {
      const hay = item.label.toLowerCase();
      if (hay.startsWith(q)) starts.push(item);
      else if (hay.includes(q)) contains.push(item);
      if (starts.length >= 8) break;
    }
    return [...starts, ...contains].slice(0, 8);
  }, [query, vocab.suggestions]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  /**
   * next-intl's router drops a query string appended to the href — it resolves
   * the string as a pathname only, so `/restaurants?q=x` navigates to
   * `/restaurants` and the search silently does nothing. The object form keeps
   * pathname and query separate, which is the form that actually carries them.
   */
  function go(params: Record<string, string>) {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value) query[key] = value;
    }
    router.push({ pathname: "/restaurants", query });
  }

  function followSuggestion(item: Suggestion) {
    setOpen(false);
    if (item.kind === "restaurant") {
      router.push(`/restaurants/${item.slug}`);
    } else if (item.kind === "cuisine") {
      go({ cuisine: item.slug });
    } else {
      go({ governorate: item.slug });
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setOpen(false);
    go({ q: query, cuisine, governorate, feature });
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
      const item = suggestions[activeIndex];
      if (!item) return;
      event.preventDefault();
      followSuggestion(item);
    }
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <form className={styles.console} onSubmit={onSubmit} role="search">
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
                /* A dead end is worse than a wrong result: the empty state
                   names the problem and offers a way forward. */
                <li className={styles.empty}>
                  <strong>{t("noResults")}</strong>
                  <span>{t("noResultsHint")}</span>
                </li>
              ) : (
                suggestions.map((item, index) => (
                  <li key={`${item.kind}-${item.slug}`} role="none">
                    <button
                      type="button"
                      id={`${listId}-opt-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      data-active={index === activeIndex}
                      onClick={() => followSuggestion(item)}
                    >
                      <span>{item.label}</span>
                      <small>{t(item.kind)}</small>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor={`${listId}-cuisine`}>{t("cuisine")}</label>
          <select
            id={`${listId}-cuisine`}
            value={cuisine}
            onChange={(event) => setCuisine(event.target.value)}
          >
            <option value="">{t("any")}</option>
            {vocab.cuisines.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor={`${listId}-gov`}>{t("governorate")}</label>
          <select
            id={`${listId}-gov`}
            value={governorate}
            onChange={(event) => setGovernorate(event.target.value)}
          >
            <option value="">{t("any")}</option>
            {vocab.governorates.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
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
            {vocab.features.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
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
