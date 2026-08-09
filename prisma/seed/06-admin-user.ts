/**
 * Seeds a dev admin account and one sample restaurant-member account (linked
 * to a real, published restaurant) so the portal, classification flow, and
 * admin moderation inbox can all be exercised end-to-end locally.
 *
 * Dev credentials (local only — change before any real deployment):
 *   admin@jra.jo     / ChangeMe123!
 *   member@jra.jo    / ChangeMe123!
 */
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);

  await db.user.upsert({
    where: { email: "admin@jra.jo" },
    update: {},
    create: {
      email: "admin@jra.jo",
      passwordHash,
      fullName: "JRA Admin",
      role: "ADMIN",
    },
  });

  const sampleRestaurant = await db.restaurant.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { name: "asc" },
  });

  if (sampleRestaurant) {
    const member = await db.user.upsert({
      where: { email: "member@jra.jo" },
      update: {},
      create: {
        email: "member@jra.jo",
        passwordHash,
        fullName: `${sampleRestaurant.name} (demo member)`,
        role: "RESTAURANT_MEMBER",
      },
    });

    await db.businessManager.upsert({
      where: { id: `demo-${member.id}` },
      update: {},
      create: { id: `demo-${member.id}`, userId: member.id, restaurantId: sampleRestaurant.id },
    });

    console.log(`✓ demo member linked to restaurant: ${sampleRestaurant.name}`);
  }

  console.log("✓ admin user: admin@jra.jo / ChangeMe123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
