"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(2),
  message: z.string().min(10),
});

export async function submitContactInquiry(
  _prevState: { ok: boolean; error?: string },
  formData: FormData
) {
  const limited = rateLimit(await clientKey("contact"), {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return { ok: false, error: "rate_limited" };
  }

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  await db.contactInquiry.create({ data: parsed.data });
  return { ok: true };
}
