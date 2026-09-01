/**
 * The interest topics offered by the newsletter form.
 *
 * Deliberately NOT declared in `actions/newsletter.ts`: that file carries
 * "use server", and a server-actions module may only export async functions.
 * A plain const exported from there reaches the client as a server reference
 * rather than an array, so `.map` on it throws at render time.
 */
export const NEWSLETTER_INTERESTS = [
  "legislation",
  "training",
  "opportunities",
  "sustainability",
] as const;

export type NewsletterInterest = (typeof NEWSLETTER_INTERESTS)[number];
