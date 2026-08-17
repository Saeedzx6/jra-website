/**
 * Per-venue contact details.
 *
 * These are NOT in the nopCommerce export — it carries only name, address,
 * description, categories, tags and three pictures (20 columns, checked). The
 * live site does render a phone and website per venue, but only in its HTML,
 * under slugs that do not match ours ("fame-2" for Fame Restaurant), and the
 * site search endpoint 404s. Filling all 718 needs either a crawl of jra.jo's
 * venue pages or a proper export from the association.
 *
 * So: verified entries go in `VENUE_CONTACT` below, and everything else falls
 * back to the association's own channels, labelled as the association's.
 *
 * Nothing here is guessed. A wrong Instagram handle does not degrade
 * gracefully — it sends people to a stranger's account.
 */

export interface VenueContact {
  phone?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
}

/** Verified by reading the venue's own page on jra.jo. Keyed by our slug. */
const VENUE_CONTACT: Record<string, VenueContact> = {
  "fame-restaurant": {
    phone: "+962795135548",
    website: "http://www.fame-jo.com",
  },
};

/**
 * The association's own channels, verified from jra.jo. Used as a clearly
 * labelled fallback when a venue has no published contact of its own — the UI
 * must never present these as belonging to the restaurant.
 */
export const associationContact = {
  phone: "+96264621558",
  facebook: "https://www.facebook.com/JoRestaurants",
  instagram: "https://www.instagram.com/jorestaurantassociation",
} as const;

export function contactFor(slug: string): VenueContact {
  return VENUE_CONTACT[slug] ?? {};
}

export function hasOwnContact(contact: VenueContact): boolean {
  return Boolean(
    contact.phone || contact.website || contact.facebook || contact.instagram,
  );
}
