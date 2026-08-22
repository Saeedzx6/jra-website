/**
 * The star grades a listing can carry.
 *
 * ClassificationLevel had zero rows, which quietly broke the whole
 * classification chain: Restaurant.classificationLevelId points here, and it
 * is what the public site reads for card badges, the star filter, profile
 * stars, JSON-LD aggregateRating and the dues tier. The scoring engine
 * computed a grade on the assessment session and there was nowhere to put it.
 *
 * Five rows, because tourist restaurants run to five stars. The other
 * standards top out at three; they simply never reference 4 or 5.
 *
 *   npm run seed:levels
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const LEVELS = [
  { stars: 1, nameEn: "One star", nameAr: "نجمة واحدة" },
  { stars: 2, nameEn: "Two stars", nameAr: "نجمتان" },
  { stars: 3, nameEn: "Three stars", nameAr: "ثلاث نجوم" },
  { stars: 4, nameEn: "Four stars", nameAr: "أربع نجوم" },
  { stars: 5, nameEn: "Five stars", nameAr: "خمس نجوم" },
];

async function main() {
  let created = 0;
  for (const l of LEVELS) {
    const existing = await db.classificationLevel.findUnique({ where: { stars: l.stars } });
    if (existing) continue;
    await db.classificationLevel.create({ data: l });
    console.log(`  ${l.stars}★  ${l.nameEn.padEnd(12)} ${l.nameAr}`);
    created++;
  }
  console.log(`\n${created} created, ${LEVELS.length - created} already present`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
