"use client";

import { useMemo, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { listings, type Listing } from "@/lib/modules";
import { pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";
import styles from "./Listings.module.css";

type Tab = "all" | Listing["category"];

const TABS: Tab[] = ["all", "business", "equipment", "investment"];

const TAB_KEY: Record<Tab, string> = {
  all: "adTypeAll",
  business: "adTypeBusiness",
  equipment: "adTypeEquipment",
  investment: "adTypeInvestment",
};

/**
 * Classifieds with a type filter.
 *
 * Filtering is local with no URL involvement: there are four fixed categories
 * over a short list, so this is a view toggle rather than a shareable search.
 */
export function Listings() {
  const t = useTranslations("modules");
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const [tab, setTab] = useState<Tab>("all");

  const counts = useMemo(() => {
    const map = new Map<Tab, number>([["all", listings.length]]);
    for (const listing of listings) {
      map.set(listing.category, (map.get(listing.category) ?? 0) + 1);
    }
    return map;
  }, []);

  const visible = tab === "all" ? listings : listings.filter((l) => l.category === tab);

  return (
    <>
      {/* Tabs, not a <select>: four options over a short list is faster to scan
          and one tap to change. */}
      <div className={styles.tabs} role="tablist" aria-label={t("listings")}>
        {TABS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            className={styles.tab}
            onClick={() => setTab(value)}
          >
            {t(TAB_KEY[value])}
            <span className={styles.count}>{counts.get(value) ?? 0}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className={styles.empty}>{t("noListings")}</p>
      ) : (
        <ul className={styles.listings}>
          {visible.map((listing) => (
            <li key={listing.id} className={styles.listing}>
              <div className={styles.head}>
                <span className="tag">{listing.city}</span>
                <span className={styles.posted}>
                  {t("posted", {
                    date: format.dateTime(new Date(listing.posted), {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }),
                  })}
                </span>
              </div>

              <h3>{pick(listing.title, locale)}</h3>
              <p>{pick(listing.body, locale)}</p>
              <p className={styles.price}>{pick(listing.price, locale)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
