/**
 * Post-deployment sanity check against whatever database is in scope.
 *
 *   npx dotenv -e .env.production.local -- node scripts/verify-prod.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
let failures = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => {
  console.log(`  ✗ ${m}`);
  failures++;
};

try {
  console.log("\nAccounts");
  const actives = await db.user.findMany({
    where: { isActive: true },
    select: { email: true, role: true },
  });
  const demos = await db.user.findMany({
    where: { email: { in: ["admin@jra.jo", "member@jra.jo"] } },
    select: { email: true, isActive: true },
  });
  for (const d of demos) {
    if (d.isActive) bad(`${d.email} is STILL ACTIVE`);
    else ok(`${d.email} disabled`);
  }
  const admins = actives.filter((u) => u.role === "ADMIN");
  if (admins.length === 0) bad("no active ADMIN account");
  else ok(`active admin(s): ${admins.map((a) => a.email).join(", ")}`);

  console.log("\nImages");
  const total = await db.restaurantImage.count();
  const local = await db.restaurantImage.count({
    where: { NOT: { url: { startsWith: "http" } } },
  });
  const cdn = total - local;
  if (local > 0) bad(`${local} of ${total} images still point at local paths`);
  else ok(`all ${total} images on the CDN`);
  if (cdn > 0) {
    const sample = await db.restaurantImage.findFirst({
      where: { url: { startsWith: "http" } },
      select: { url: true },
    });
    ok(`sample: ${sample.url.slice(0, 72)}…`);
  }

  console.log("\nContent");
  ok(`restaurants: ${await db.restaurant.count()}`);
  ok(`published:   ${await db.restaurant.count({ where: { status: "PUBLISHED" } })}`);
  ok(`news:        ${await db.newsArticle.count()}`);
  ok(`applications: ${await db.membershipApplication.count()}`);
} catch (e) {
  bad(`query failed: ${e.message}`);
} finally {
  await db.$disconnect();
}

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} problem(s).\n`);
process.exitCode = failures === 0 ? 0 : 1;
