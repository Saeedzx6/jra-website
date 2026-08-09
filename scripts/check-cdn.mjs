/**
 * Fetches a handful of migrated image URLs straight from the database and
 * confirms the CDN actually serves them. Proves the migration end to end
 * rather than trusting the row values.
 *
 *   npx dotenv -e .env.production.local -- node scripts/check-cdn.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
let failures = 0;

try {
  const rows = await db.restaurantImage.findMany({
    where: { url: { startsWith: "http" } },
    select: { url: true },
    take: 5,
  });

  for (const { url } of rows) {
    const res = await fetch(url, { method: "HEAD" });
    const kb = Math.round(Number(res.headers.get("content-length") ?? 0) / 1024);
    const type = res.headers.get("content-type") ?? "?";
    if (res.ok) console.log(`  ✓ ${res.status} ${type} ${kb}KB  ${url.slice(-48)}`);
    else {
      console.log(`  ✗ ${res.status}  ${url}`);
      failures++;
    }
  }
} catch (e) {
  console.error("FAIL:", e.message);
  failures++;
} finally {
  await db.$disconnect();
}

console.log(failures === 0 ? "\nCDN serving correctly.\n" : `\n${failures} failed.\n`);
process.exitCode = failures === 0 ? 0 : 1;
