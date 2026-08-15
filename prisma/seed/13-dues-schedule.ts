/**
 * Seeds a starting dues schedule.
 *
 * The amounts here are placeholders — JRA sets its own rates, and these exist
 * so invoicing has something to resolve against in development. Replace them
 * with the association's published fees before running this anywhere real.
 *
 *   npm run seed:dues
 */
import { PrismaClient, Prisma, type MembershipClass } from "@prisma/client";

const db = new PrismaClient();

const EFFECTIVE_FROM = new Date("2026-01-01T00:00:00Z");

type Row = { class: MembershipClass; stars: number | null; annualAmount: string };

const ROWS: Row[] = [
  // Class-wide default, used when a restaurant has no classification yet —
  // which today is every one of them.
  { class: "ACTIVE_RESTAURANT", stars: null, annualAmount: "250.000" },
  // Graded rates: a five-star establishment does not pay what a cafe pays.
  { class: "ACTIVE_RESTAURANT", stars: 1, annualAmount: "150.000" },
  { class: "ACTIVE_RESTAURANT", stars: 2, annualAmount: "250.000" },
  { class: "ACTIVE_RESTAURANT", stars: 3, annualAmount: "400.000" },
  { class: "ACTIVE_RESTAURANT", stars: 4, annualAmount: "650.000" },
  { class: "ACTIVE_RESTAURANT", stars: 5, annualAmount: "1000.000" },
  { class: "ASSOCIATE_SUPPLIER", stars: null, annualAmount: "300.000" },
  { class: "HONORARY", stars: null, annualAmount: "0.000" },
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const row of ROWS) {
    const existing = await db.duesSchedule.findFirst({
      where: { class: row.class, stars: row.stars, effectiveFrom: EFFECTIVE_FROM },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await db.duesSchedule.create({
      data: {
        class: row.class,
        stars: row.stars,
        annualAmount: new Prisma.Decimal(row.annualAmount),
        currency: "JOD",
        effectiveFrom: EFFECTIVE_FROM,
      },
    });
    created++;
  }

  console.log(`dues schedule: ${created} created, ${skipped} already present`);
  console.log("NOTE: amounts are placeholders — replace with JRA's published fees.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
