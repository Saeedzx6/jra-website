import { getTranslations } from "next-intl/server";
import { SAMPLE_HOURS } from "@/lib/directory";
import styles from "./OpeningHours.module.css";

/**
 * Opening hours.
 *
 * The source export carries no hours, so this renders the documented sample
 * pattern and says so on screen. The notice is not a footnote in small grey
 * type at the bottom — it sits directly under the table, because someone
 * planning a Friday lunch needs to see it before they act on the times.
 */
export async function OpeningHours() {
  const t = await getTranslations("directory");

  return (
    <div className={styles.hours}>
      <dl className={styles.list}>
        {SAMPLE_HOURS.map((slot, day) => (
          <div key={day} className={styles.row}>
            <dt>{t(`days.${day}`)}</dt>
            <dd dir="ltr">
              {slot ? `${slot.open} – ${slot.close}` : t("closed")}
            </dd>
          </div>
        ))}
      </dl>

      <p className={styles.notice}>{t("hoursUnconfirmed")}</p>
    </div>
  );
}
