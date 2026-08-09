import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function GET(req: Request) {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) return new NextResponse("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const interest = searchParams.get("interest");

  const subscribers = await db.newsletterSubscriber.findMany({
    where: {
      status: "SUBSCRIBED",
      ...(interest ? { interests: { has: interest } } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  const header = "Email,Interests,Locale,Subscribed At";
  const rows = subscribers.map((s) =>
    [s.email, s.interests.join("; "), s.localePref, s.createdAt.toISOString()]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-subscribers.csv"`,
    },
  });
}
