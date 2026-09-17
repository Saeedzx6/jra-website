/**
 * Puts the re-rating journey into the local database so it can be walked.
 *
 * The "request a re-rating" button in the member portal only appears for a
 * restaurant whose classification JRA has already approved, and the admin
 * queue only shows requests that exist. With an empty assessments table
 * neither is visible, which makes the whole flow impossible to look at.
 *
 * This creates the minimum for that: a member linked to a restaurant, an
 * approved rating for it, and one re-rating request waiting for a decision.
 *
 * Local only. It refuses to run against anything that is not localhost --
 * these are fabricated ratings, and a fabricated approved grade in the real
 * database is a restaurant advertising stars JRA never awarded.
 *
 *   node scripts/seed-rerating-demo.mjs
 *   node scripts/seed-rerating-demo.mjs --undo
 */
import { PrismaClient } from "@prisma/client";

const UNDO = process.argv.includes("--undo");
const MEMBER_EMAIL = "member@jra.jo";

const url = process.env.DATABASE_URL ?? "";
const host = (() => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
})();

if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
  console.error(
    `Refusing to run: DATABASE_URL points at ${host || "an unreadable host"}, not localhost.\n` +
      "This writes fabricated approved classifications, which must never reach the real database."
  );
  process.exit(1);
}

const db = new PrismaClient();

const member = await db.user.findUnique({ where: { email: MEMBER_EMAIL } });
if (!member) {
  console.error(`No user ${MEMBER_EMAIL} in this database. Run the normal seed first.`);
  process.exit(1);
}

if (UNDO) {
  const { count } = await db.assessmentSession.deleteMany({
    where: { startedById: member.id },
  });
  console.log(`Removed ${count} demo assessment session(s).`);
  await db.$disconnect();
  process.exit(0);
}

// Reuse the restaurant this member already manages, so the demo does not
// quietly attach them to a second one.
let link = await db.businessManager.findFirst({
  where: { userId: member.id, restaurantId: { not: null } },
  include: { restaurant: true },
});

if (!link) {
  const restaurant = await db.restaurant.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { name: "asc" },
  });
  if (!restaurant) {
    console.error("No published restaurant to attach the member to.");
    process.exit(1);
  }
  link = await db.businessManager.create({
    data: { userId: member.id, restaurantId: restaurant.id },
    include: { restaurant: true },
  });
  console.log(`Linked ${MEMBER_EMAIL} to ${restaurant.name}.`);
}

const restaurant = link.restaurant;
if (!restaurant) {
  console.error("The member's link has no restaurant on it.");
  process.exit(1);
}

await db.assessmentSession.deleteMany({
  where: { restaurantId: restaurant.id, startedById: member.id },
});

// Cycle 1: the rating done on joining, approved. This is what makes the
// portal offer "request a re-rating" at all.
await db.assessmentSession.create({
  data: {
    restaurantId: restaurant.id,
    establishmentType: restaurant.establishmentType,
    startedById: member.id,
    status: "APPROVED",
    cycle: 1,
    totalScore: 412,
    resultingStars: 3,
    submittedAt: new Date(Date.now() - 90 * 24 * 3600 * 1000),
    reviewedAt: new Date(Date.now() - 85 * 24 * 3600 * 1000),
  },
});

// Cycle 2: the request waiting on JRA, which is what the admin queue lists.
await db.assessmentSession.create({
  data: {
    restaurantId: restaurant.id,
    establishmentType: restaurant.establishmentType,
    startedById: member.id,
    status: "REQUESTED",
    cycle: 2,
    requestedReason:
      "We rebuilt the kitchen and added an outdoor terrace in March, and we " +
      "believe the venue now meets the four-star requirements.",
  },
});

console.log(`
Seeded against: ${restaurant.name}

  Admin  -> /en/admin/assessments      one request under "Re-rating requests"
  Member -> /en/portal/classification  logged in as ${MEMBER_EMAIL}

Note the member currently shows "awaiting opening" -- cycle 2 is REQUESTED.
Open or refuse it on the admin screen and reload the portal to see it move.

Undo with: node scripts/seed-rerating-demo.mjs --undo
`);

await db.$disconnect();
