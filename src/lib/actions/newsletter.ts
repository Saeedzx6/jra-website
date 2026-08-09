"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

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

  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: "invalid-email" };
  }

  await db.newsletterSubscriber.upsert({
    where: { email: parsed.data.email.toLowerCase() },
    update: { status: "SUBSCRIBED" },
    create: { email: parsed.data.email.toLowerCase(), interests: [] },
  });

  return { ok: true };
}
