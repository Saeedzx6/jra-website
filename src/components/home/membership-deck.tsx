"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./membership-deck.module.css";

export type MembershipSlide = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  image: string;
};

export function MembershipDeck({ slides }: { slides: MembershipSlide[] }) {
  const t = useTranslations("common");
  const [index, setIndex] = useState(0);

  const slide = slides[index];
  if (!slide) return null;

  const move = (step: number) =>
    setIndex((i) => (i + step + slides.length) % slides.length);

  return (
    <section className={styles.deck} aria-roledescription="carousel">
      <div className={styles.slide}>
        <div className={styles.copy}>
          <span className="eyebrow">{slide.eyebrow}</span>
          <h2 className="display">{slide.title}</h2>
          <p>{slide.body}</p>
          <Link href="/membership" className="btn btn-light">
            {slide.cta}
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

      {slides.length > 1 && (
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
              {index + 1} / {slides.length}
            </span>
          </div>
        </div>
      )}
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
