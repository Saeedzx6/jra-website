/**
 * Shows the most recent membership applications, so a live form submission can
 * be traced end to end from the public site into the production database.
 *
 *   npx dotenv -e .env.production.local -- node scripts/check-latest-application.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

try {
  const total = await db.membershipApplication.count();
  console.log(`total applications: ${total}\n`);

  const rows = await db.membershipApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      businessName: true,
      contactName: true,
      email: true,
      phone: true,
      applicantType: true,
      status: true,
      createdAt: true,
      documents: true,
    },
  });

  for (const r of rows) {
    const age = Math.round((Date.now() - r.createdAt.getTime()) / 1000);
    const files = r.documents?.files ?? [];
    console.log(`${r.businessName}  (${age}s ago)`);
    console.log(`  contact: ${r.contactName} · ${r.email} · ${r.phone}`);
    console.log(`  type: ${r.applicantType}  status: ${r.status}`);
    console.log(`  documents: ${files.length ? files.join(", ") : "none"}`);
    console.log();
  }
} catch (e) {
  console.error("FAIL:", e.message);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
