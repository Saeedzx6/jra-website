import Image from "next/image";
import { getFormatter, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { news, pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";
import styles from "./NewsGrid.module.css";

export async function NewsGrid() {
  const locale = (await getLocale()) as Locale;
  const format = await getFormatter();

  return (
    <ul className={styles.grid}>
      {news.map((article) => (
        <li key={article.slug}>
          <article className={styles.card}>
            <div className={`media ${styles.media}`}>
              <Image
                src={article.image}
                alt=""
                width={640}
                height={400}
                sizes="(min-width: 940px) 33vw, 100vw"
              />
            </div>

            <div className={styles.body}>
              <p className={styles.date}>
                <b>{pick(article.kicker, locale)}</b>{" "}
                {/* Locale-aware date: ar-JO renders Arabic month names. */}
                <time dateTime={article.date}>
                  {format.dateTime(new Date(article.date), {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </p>

              <h3 className={styles.title}>
                <Link href={`/news/${article.slug}`}>
                  {pick(article.title, locale)}
                </Link>
              </h3>

              <p className={styles.excerpt}>{pick(article.body, locale)}</p>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
