/**
 * Creates the real production admin and disables the demo accounts.
 *
 * The dev seed (06-admin-user.ts) ships admin@jra.jo / ChangeMe123! — fine
 * locally, unacceptable on a public site, and those rows travel with any
 * pg_dump/restore. Run this once against production:
 *
 *   ADMIN_EMAIL="you@jra.jo" ADMIN_PASSWORD="..." ADMIN_NAME="Your Name" \
 *     npx dotenv -e .env.production.local -- npm run seed:prod-admin
 *
 * Re-running it resets that admin's password, so it doubles as password reset.
 */
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const DEMO_ACCOUNTS = ["admin@jra.jo", "member@jra.jo"];

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME?.trim() || "JRA Administrator";

  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD.");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }
  if (DEMO_ACCOUNTS.includes(email)) {
    console.error(`Pick an address other than the seeded demo ones.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", isActive: true, fullName },
    create: { email, passwordHash, fullName, role: "ADMIN" },
  });
  console.log(`✓ admin ready: ${email}`);

  // Deactivated rather than deleted: they own audit-log entries and the demo
  // member is linked to a real restaurant, so removing them would cascade.
  const disabled = await db.user.updateMany({
    where: { email: { in: DEMO_ACCOUNTS } },
    data: { isActive: false },
  });
  console.log(`✓ demo accounts disabled: ${disabled.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
