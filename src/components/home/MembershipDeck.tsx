"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { membership, pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";
import styles from "./MembershipDeck.module.css";

export function MembershipDeck() {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  const [index, setIndex] = useState(0);

  // `index` is always kept in range by `move`, but the index signature is
  // still `T | undefined` under noUncheckedIndexedAccess. Falling back to the
  // first slide keeps the carousel rendering rather than blanking the section.
  const slide = membership[index] ?? membership[0];
  const move = (step: number) =>
    setIndex((i) => (i + step + membership.length) % membership.length);

  if (!slide) return null;

  return (
    <section className={styles.deck} aria-roledescription="carousel">
      <div className={styles.slide}>
        <div className={styles.copy}>
          <span className="eyebrow">{pick(slide.eyebrow, locale)}</span>
          <h2 className="display">{pick(slide.title, locale)}</h2>
          <p>{pick(slide.body, locale)}</p>
          <Link href="/membership" className="btn btn-light">
            {pick(slide.cta, locale)}
          </Link>
        </div>

        <div className={`media ${styles.media}`}>
          <Image
            src={slide.image}
            alt=""
            width={900}
            height={700}
            sizes="(min-width: 900px) 50vw, 100vw"
          />
        </div>
      </div>

      <div className={styles.foot}>
        <div className={styles.nav}>
          <button
            type="button"
            className="icon-btn"
            aria-label={t("previous")}
            onClick={() => move(-1)}
          >
            <Chevron direction="start" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={t("next")}
            onClick={() => move(1)}
          >
            <Chevron direction="end" />
          </button>
          <span className={styles.count} aria-live="polite">
            {index + 1} / {membership.length}
          </span>
        </div>
      </div>
    </section>
  );
}

function Chevron({ direction }: { direction: "start" | "end" }) {
  return (
    <svg
      className="mirror"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={direction === "end" ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
