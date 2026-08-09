/**
 * Shows the most recently added restaurant images, to confirm an admin upload
 * reached Cloudinary under the expected jra/ path rather than local disk.
 *
 *   npx dotenv -e .env.production.local -- node scripts/check-latest-upload.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

try {
  const rows = await db.restaurantImage.findMany({
    orderBy: { id: "desc" },
    take: 3,
    select: {
      url: true,
      isPrimary: true,
      legacyPath: true,
      restaurant: { select: { name: true, slug: true } },
    },
  });

  for (const r of rows) {
    const kind = r.url.startsWith("http") ? "CDN" : "LOCAL DISK";
    console.log(`${r.restaurant.name}`);
    console.log(`  ${kind}: ${r.url}`);
    console.log(`  primary: ${r.isPrimary}  migrated-from: ${r.legacyPath ?? "n/a"}`);

    if (r.url.startsWith("http")) {
      const res = await fetch(r.url, { method: "HEAD" });
      console.log(`  fetch: ${res.status} ${res.headers.get("content-type")}`);
    }
    console.log();
  }

  const local = await db.restaurantImage.count({
    where: { NOT: { url: { startsWith: "http" } } },
  });
  console.log(local === 0 ? "✓ no images on local disk" : `✗ ${local} still local`);
} catch (e) {
  console.error("FAIL:", e.message);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
