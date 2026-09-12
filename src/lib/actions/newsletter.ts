"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { NEWSLETTER_INTERESTS } from "@/lib/newsletter-interests";

/**
 * The subscriber row has always carried an `interests` column and nothing ever
 * wrote to it. The form now collects them, so they are validated against the
 * fixed set rather than trusted — this is an unauthenticated public form, and
 * an open string[] is an invitation to store whatever is posted.
 */
const schema = z.object({
  email: z.string().email(),
  interests: z.array(z.enum(NEWSLETTER_INTERESTS)).max(NEWSLETTER_INTERESTS.length),
});

export async function subscribeToNewsletter(
  _prevState: { ok: boolean; error?: string },
  formData: FormData
) {
  const limited = rateLimit(await clientKey("newsletter"), {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return { ok: false, error: "rate_limited" };
  }

  const parsed = schema.safeParse({
    email: formData.get("email"),
    // Unknown values are dropped rather than failing the whole submission: a
    // stale checkbox should not cost someone their subscription.
    interests: formData
      .getAll("interests")
      .filter((v): v is string => typeof v === "string")
      .filter((v) => (NEWSLETTER_INTERESTS as readonly string[]).includes(v)),
  });
  if (!parsed.success) {
    return { ok: false, error: "invalid-email" };
  }

  const email = parsed.data.email.toLowerCase();

  await db.newsletterSubscriber.upsert({
    where: { email },
    // Re-subscribing replaces the interests rather than merging: the form
    // shows the full set, so what was submitted is the complete intent.
    update: { status: "SUBSCRIBED", interests: parsed.data.interests },
    create: { email, interests: parsed.data.interests },
  });

  return { ok: true };
}
