import Image from "next/image";
import { getFormatter } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import styles from "./news-grid.module.css";

export type NewsCard = {
  slug: string;
  kicker: string | null;
  date: string | null;
  title: string;
  excerpt: string | null;
  image: string | null;
};

export async function NewsGrid({ articles }: { articles: NewsCard[] }) {
  const format = await getFormatter();

  return (
    <ul className={styles.grid}>
      {articles.map((article) => (
        <li key={article.slug}>
          <article className={styles.card}>
            {article.image && (
              <div className={`media ${styles.media}`}>
                <Image
                  src={article.image}
                  alt=""
                  width={640}
                  height={400}
                  sizes="(min-width: 940px) 33vw, 100vw"
                />
              </div>
            )}

            <div className={styles.body}>
              {(article.kicker || article.date) && (
                <p className={styles.date}>
                  {article.kicker && <b>{article.kicker}</b>}{" "}
                  {/* Locale-aware date: ar-JO renders Arabic month names. */}
                  {article.date && (
                    <time dateTime={article.date}>
                      {format.dateTime(new Date(article.date), {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                  )}
                </p>
              )}

              <h3 className={styles.title}>
                <Link href={`/news/${article.slug}`}>{article.title}</Link>
              </h3>

              {article.excerpt && <p className={styles.excerpt}>{article.excerpt}</p>}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
