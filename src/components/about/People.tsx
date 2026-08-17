import Image from "next/image";
import { getLocale } from "next-intl/server";
import { pick } from "@/lib/content";
import type { Person } from "@/lib/organisation";
import type { Locale } from "@/i18n/routing";
import styles from "./People.module.css";

export async function People({
  people,
  leadFirst = false,
}: {
  people: Person[];
  /** Give the first entry (the president) a wider cell. */
  leadFirst?: boolean;
}) {
  const locale = (await getLocale()) as Locale;

  return (
    <ul className={styles.grid}>
      {people.map((person, index) => (
        <li
          key={person.name}
          className={`${styles.person} ${leadFirst && index === 0 ? styles.lead : ""}`}
        >
          <div className={styles.portrait}>
            <Image
              src={person.photo}
              /* Decorative: the name sits directly beneath in text, so
                 announcing it twice would only add noise. */
              alt=""
              width={400}
              height={400}
              sizes="(min-width: 1100px) 25vw, (min-width: 700px) 33vw, 50vw"
            />
          </div>

          <div className={styles.body}>
            {/* Latin names on an RTL page — isolate so trailing punctuation
                and the "Eng." prefix stay put. */}
            <h3 className={styles.name}>
              <bdi dir="auto">{person.name}</bdi>
            </h3>
            <p className={styles.role}>{pick(person.role, locale)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
