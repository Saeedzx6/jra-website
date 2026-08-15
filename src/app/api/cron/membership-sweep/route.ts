import { NextResponse } from "next/server";
import { sweepStandings, membershipHealth } from "@/lib/membership";

/**
 * Nightly membership sweep: moves terms through GOOD -> GRACE -> LAPSED.
 *
 * Triggered by Vercel Cron (see vercel.json). Vercel signs scheduled requests
 * with CRON_SECRET as a bearer token; the same secret lets an admin run it by
 * hand. Without a configured secret the route refuses rather than running
 * open, since it mutates every member's standing.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 }
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const started = Date.now();
  const swept = await sweepStandings();
  const health = await membershipHealth();

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    swept,
    health,
  });
}
