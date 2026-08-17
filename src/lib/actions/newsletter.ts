"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  // The signup form offers interest checkboxes; they were previously dropped
  // and every subscriber stored with an empty list. Optional so a bare email
  // form (or a caller that omits them) still validates.
  interests: z.array(z.string().min(1)).default([]),
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
    interests: formData.getAll("interests").map(String).filter(Boolean),
  });
  if (!parsed.success) {
    return { ok: false, error: "invalid-email" };
  }

  const email = parsed.data.email.toLowerCase();

  await db.newsletterSubscriber.upsert({
    where: { email },
    // Re-subscribing replaces the interest list rather than merging: the form
    // shows the full set of checkboxes every time, so what is submitted is the
    // subscriber's current intent, and merging would make it impossible to
    // ever remove an interest.
    update: { status: "SUBSCRIBED", interests: parsed.data.interests },
    create: { email, interests: parsed.data.interests },
  });

  return { ok: true };
}
