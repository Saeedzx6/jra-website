"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { classificationGroups } from "@/lib/modules";
import { pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";
import styles from "./SelfAssessment.module.css";

/**
 * Weighted readiness self-assessment.
 *
 * Scoring is local and instantaneous — there is no submission, and none is
 * implied. The panel states plainly that the result is indicative, because a
 * number presented next to the word "classification" will otherwise be read as
 * an official grade.
 */
export function SelfAssessment() {
  const locale = useLocale() as Locale;
  const t = useTranslations("classification");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const { score, total, percent } = useMemo(() => {
    let score = 0;
    let total = 0;
    for (const group of classificationGroups) {
      for (const criterion of group.criteria) {
        total += criterion.weight;
        if (checked[criterion.id]) score += criterion.weight;
      }
    }
    return { score, total, percent: total ? Math.round((score / total) * 100) : 0 };
  }, [checked]);

  const band =
    percent >= 85 ? "ready" : percent >= 60 ? "close" : "early";

  return (
    <div className={styles.layout}>
      <form>
        {classificationGroups.map((group) => (
          <fieldset key={group.key} className={styles.group}>
            <legend>{pick(group.title, locale)}</legend>

            {group.criteria.map((criterion) => (
              <label key={criterion.id} className={styles.criterion}>
                <input
                  type="checkbox"
                  checked={Boolean(checked[criterion.id])}
                  onChange={(event) =>
                    setChecked((current) => ({
                      ...current,
                      [criterion.id]: event.target.checked,
                    }))
                  }
                />
                <span>{pick(criterion.label, locale)}</span>
                <span className={styles.weight} aria-label={t("weight")}>
                  {criterion.weight}
                </span>
              </label>
            ))}
          </fieldset>
        ))}
      </form>

      <aside className={styles.score}>
        <h2>{t("scoreTitle")}</h2>

        {/* The animated figure is aria-hidden; the live region below carries
            the same information as a single sentence for screen readers. */}
        <p className={styles.figure} aria-hidden="true">
          {percent}%
        </p>

        <div
          className={styles.bar}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("scoreTitle")}
        >
          <div className={styles.barFill} style={{ inlineSize: `${percent}%` }} />
        </div>

        <p className={styles.band} role="status" aria-live="polite">
          {t(`band.${band}`)} — {t("points", { score, total })}
        </p>

        <p className={styles.hint}>{t(`hint.${band}`)}</p>

        <p className={styles.disclaimer}>{t("disclaimer")}</p>
      </aside>
    </div>
  );
}
