import { getLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pick, type Localized, type Notice } from "@/lib/content";
import styles from "./Cards.module.css";

export interface CardItem {
  title: Localized;
  body: Localized;
  meta?: Localized;
}

export async function CardGrid({
  items,
  columns = 2,
}: {
  items: CardItem[];
  columns?: 2 | 3;
}) {
  const locale = (await getLocale()) as Locale;

  return (
    <ul className={`${styles.grid} ${columns === 3 ? styles.cols3 : ""}`}>
      {items.map((item) => (
        <li key={item.title.en} className={styles.card}>
          {item.meta && <span className={styles.meta}>{pick(item.meta, locale)}</span>}
          <h3>{pick(item.title, locale)}</h3>
          <p>{pick(item.body, locale)}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * Alerts and opportunities. `tone` selects the status hue — the only two
 * non-brand colours in the system, and the reason they exist is that "a rule
 * changed" and "an opportunity opened" must be told apart at a glance.
 */
export async function NoticeList({
  items,
  tone,
}: {
  items: Notice[];
  tone: "alert" | "good";
}) {
  const locale = (await getLocale()) as Locale;
  const color = tone === "alert" ? "var(--status-alert)" : "var(--status-good)";

  return (
    <ul className={styles.notices}>
      {items.map((item) => (
        <li
          key={item.title.en}
          className={styles.notice}
          style={{ "--notice": color } as React.CSSProperties}
        >
          <span className={`tag ${styles.tag}`}>{pick(item.tag, locale)}</span>
          <h3>{pick(item.title, locale)}</h3>
          <p>{pick(item.body, locale)}</p>
        </li>
      ))}
    </ul>
  );
}

export async function Prose({
  sections,
}: {
  sections: Array<{ title: Localized; body: Localized }>;
}) {
  const locale = (await getLocale()) as Locale;

  return (
    <div className={styles.prose}>
      {sections.map((section) => (
        <section key={section.title.en}>
          <h2>{pick(section.title, locale)}</h2>
          <p>{pick(section.body, locale)}</p>
        </section>
      ))}
    </div>
  );
}
