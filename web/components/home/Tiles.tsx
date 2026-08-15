import Image from "next/image";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { destinations, pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";
import styles from "./Tiles.module.css";

export async function Tiles() {
  const locale = (await getLocale()) as Locale;

  return (
    <ul className={styles.tiles}>
      {destinations.map((destination) => (
        <li
          key={destination.key}
          className={styles.tile}
          style={{ "--tile": `var(--${destination.color})` } as React.CSSProperties}
        >
          <div className={styles.media}>
            <Image
              src={destination.image}
              alt=""
              width={800}
              height={600}
              sizes="(min-width: 1040px) 33vw, (min-width: 700px) 50vw, 100vw"
            />
          </div>

          <div className={styles.panel}>
            <span className="eyebrow">{pick(destination.eyebrow, locale)}</span>
            <h3>{pick(destination.title, locale)}</h3>

            <div className={styles.reveal}>
              <p>{pick(destination.body, locale)}</p>
              {/* A text cue rather than a solid button. The whole tile is
                  already the link, so six filled buttons only added weight to
                  a page that had too many of them. aria-hidden because the
                  real link below carries the accessible name. */}
              <span className={styles.cue} aria-hidden="true">
                {pick(destination.cta, locale)}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mirror">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>

          <Link href={destination.href} className={styles.link}>
            <span className="sr-only">
              {pick(destination.eyebrow, locale)} — {pick(destination.cta, locale)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
