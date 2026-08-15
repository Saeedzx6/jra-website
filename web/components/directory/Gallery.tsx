"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import styles from "./Gallery.module.css";

/**
 * Photo gallery with a lightbox.
 *
 * Dialog behaviour is the fiddly part and is done properly: focus moves into
 * the dialog on open and returns to the thumbnail that opened it on close,
 * Escape closes, arrow keys move between photos, focus is trapped while open,
 * and the page behind is locked and hidden from assistive tech.
 */
export function Gallery({ photos, name }: { photos: string[]; name: string }) {
  const t = useTranslations("directory");
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpen(null);
    openerRef.current?.focus();
  }, []);

  const move = useCallback(
    (step: number) =>
      setOpen((current) =>
        current === null ? current : (current + step + photos.length) % photos.length,
      ),
    [photos.length],
  );

  useEffect(() => {
    if (open === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") move(1);
      else if (event.key === "ArrowLeft") move(-1);
      else if (event.key === "Tab") {
        // Trap: the dialog's controls are the only tabbable things while open.
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, move]);

  if (photos.length === 0) {
    return <p className={styles.empty}>{t("noPhotos")}</p>;
  }

  return (
    <>
      <ul className={styles.grid} data-count={Math.min(photos.length, 3)}>
        {photos.map((src, index) => (
          <li key={src}>
            <button
              type="button"
              className={styles.thumb}
              aria-label={t("viewPhoto", { n: index + 1 })}
              onClick={(event) => {
                openerRef.current = event.currentTarget;
                setOpen(index);
              }}
            >
              <Image
                src={src}
                alt=""
                width={800}
                height={600}
                sizes="(min-width: 900px) 33vw, 100vw"
              />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={name}
          ref={dialogRef}
          tabIndex={-1}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className={styles.stage}>
            <Image
              src={photos[open]}
              alt=""
              width={1600}
              height={1200}
              sizes="90vw"
              className={styles.full}
            />
          </div>

          <div className={styles.controls}>
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={t("prevPhoto")}
                  onClick={() => move(-1)}
                >
                  <Chevron dir="start" />
                </button>
                <span className={styles.counter}>
                  {open + 1} / {photos.length}
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={t("nextPhoto")}
                  onClick={() => move(1)}
                >
                  <Chevron dir="end" />
                </button>
              </>
            )}
            <button
              type="button"
              className="icon-btn"
              aria-label={t("closeGallery")}
              onClick={close}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Chevron({ dir }: { dir: "start" | "end" }) {
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
        d={dir === "end" ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
