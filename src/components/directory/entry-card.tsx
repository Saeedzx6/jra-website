import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { RestaurantCardData } from "@/components/restaurant-card";
import styles from "./entry-card.module.css";

/** First letter of the name, used when an entry has no photography. */
function monogram(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "J";
}

export function EntryCard({
  entry,
  variant = "grid",
}: {
  entry: RestaurantCardData;
  variant?: "grid" | "rail";
}) {
  const locale = useLocale();
  const ar = locale === "ar";

  const name = (ar && entry.nameAr) || entry.name;
  const category = (ar && entry.cuisineNameAr) || entry.cuisineName;
  const city = (ar && entry.governorateNameAr) || entry.governorateName;
  const tags = (entry.tags ?? []).map((t) => (ar && t.ar ? t.ar : t.en));

  return (
    <article className={`${styles.card} ${variant === "rail" ? styles.railCard : ""}`}>
      <div className={`media ${styles.media}`}>
        {entry.imageUrl ? (
          <Image
            src={entry.imageUrl}
            alt=""
            width={640}
            height={480}
            sizes="(min-width: 1040px) 320px, 80vw"
          />
        ) : (
          <div className={styles.fallback} aria-hidden="true">
            {monogram(name)}
          </div>
        )}
      </div>

      <div className={styles.body}>
        {/* Category sits above the name as a small label rather than being run
            together with the city below it. It is the thing people scan for,
            so it gets its own line and the accent colour. */}
        {category && (
          <p className={styles.category}>
            <bdi dir="auto">{category}</bdi>
          </p>
        )}

        {/* <bdi> isolates the name from the surrounding paragraph direction.
            Most member names are Latin script while the Arabic page runs RTL,
            and without isolation the bidi algorithm moves trailing neutral
            characters to the wrong end — "A.Kayyali & Co." renders as
            ".A.Kayyali & Co". dir="auto" lets the browser infer per entry, so
            Arabic-named members still lay out correctly. */}
        <h3 className={styles.title}>
          <Link href={`/restaurants/${entry.slug}`}>
            <bdi dir="auto">{name}</bdi>
          </Link>
        </h3>

        {/* City is only shown when the record actually has one. An empty line
            is better than a confidently wrong governorate — 288 listings have
            none assigned. */}
        {city && (
          <p className={styles.meta}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <bdi dir="auto">{city}</bdi>
          </p>
        )}

        {tags.length > 0 && (
          <ul className={styles.tags}>
            {tags.slice(0, 3).map((tag) => (
              <li key={tag} className="tag">
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
