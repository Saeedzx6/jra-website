import { getTranslations } from "next-intl/server";
import {
  associationContact,
  contactFor,
  hasOwnContact,
} from "@/lib/venue-contact";
import styles from "./ContactActions.module.css";

/**
 * Call / website / social actions for a venue.
 *
 * When the venue publishes its own details they are shown as its own. When it
 * does not, the association's channels appear under an explicit heading saying
 * whose they are — presenting JRA's Instagram as the restaurant's would be
 * worse than showing nothing.
 */
export async function ContactActions({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const t = await getTranslations("directory");
  const contact = contactFor(slug);
  const own = hasOwnContact(contact);

  const phone = own ? contact.phone : associationContact.phone;
  const facebook = own ? contact.facebook : associationContact.facebook;
  const instagram = own ? contact.instagram : associationContact.instagram;

  return (
    <div className={styles.actions}>
      {phone && (
        <a className={`btn ${styles.call}`} href={`tel:${phone.replace(/\s/g, "")}`}>
          <PhoneIcon />
          {/* dir="ltr" so the +962 prefix stays on the correct side in Arabic. */}
          <span dir="ltr">{phone}</span>
          <span className="sr-only"> — {name}</span>
        </a>
      )}

      <div className={styles.socials}>
        {contact.website && (
          <a
            className={styles.social}
            href={contact.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t("website")} — ${name}`}
          >
            <GlobeIcon />
          </a>
        )}
        {facebook && (
          <a
            className={styles.social}
            href={facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Facebook — ${own ? name : t("associationChannels")}`}
          >
            <FacebookIcon />
          </a>
        )}
        {instagram && (
          <a
            className={styles.social}
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram — ${own ? name : t("associationChannels")}`}
          >
            <InstagramIcon />
          </a>
        )}
      </div>

      {!own && <p className={styles.note}>{t("contactViaAssociation")}</p>}
    </div>
  );
}

/* Icons are inline SVG, per the design system's no-emoji, single-family rule.
   All 1.8 stroke, 24-box, so weight matches across the set. */

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 8.5V7a1.5 1.5 0 011.5-1.5H17V3h-2.5A4 4 0 0010.5 7v1.5H8.5V11h2v10h3.5V11h2.2l.4-2.5H14z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}
