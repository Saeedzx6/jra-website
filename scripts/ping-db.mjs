/**
 * Connects through whatever DATABASE_URL is in scope (the pooled endpoint in
 * production) and reports row counts. Used to prove the app's own connection
 * path works, not just the direct one migrations use.
 *
 *   npx dotenv -e .env.production.local -- node scripts/ping-db.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

try {
  const host = new URL(process.env.DATABASE_URL).hostname;
  console.log(`host: ${host}`);
  console.log(`pooled: ${host.includes("-pooler")}`);
  console.log(`restaurants: ${await db.restaurant.count()}`);
  console.log(`images:      ${await db.restaurantImage.count()}`);
  console.log(`users:       ${await db.user.count()}`);
  console.log("OK");
} catch (e) {
  console.error("FAIL:", e.message);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
