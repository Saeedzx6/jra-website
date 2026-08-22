/**
 * JRA's real fee schedule, effective 01/09/2025.
 *
 * Transcribed from `رسوم الإشتراك السنوية إعتباراً من تاريخ 1-9-2025` in the
 * assets folder. These replace the placeholder figures this file previously
 * carried, which were invented and never applied to production.
 *
 * Two fees per row: رسم الإنتساب, paid once on joining, and رسم الإشتراك
 * السنوي, the recurring annual subscription. Tourist restaurants are priced on
 * their star grade; coffee shops, fast food and bar/nightclub/disco each sit
 * at a single flat rate regardless of grade.
 *
 * Three rules from the same document are NOT modelled here, because each is
 * logic rather than a rate — see the notes at the end of this file:
 *   - Article 16: joining fee is halved outside Amman
 *   - Article 16: fees fall due in March; part of a year counts as a full year
 *   - Article 29: 10% of the annual fee per month late, or part month
 *
 *   npm run seed:dues
 */
import { PrismaClient, Prisma, type EstablishmentType, type MembershipClass } from "@prisma/client";

const db = new PrismaClient();

const EFFECTIVE_FROM = new Date("2025-09-01T00:00:00Z");

type Row = {
  class: MembershipClass;
  establishmentType: EstablishmentType | null;
  stars: number | null;
  joining: string;
  annual: string;
  note: string;
};

const ROWS: Row[] = [
  // مطعم سياحي — graded 1 to 5 stars, ascending.
  { class: "ACTIVE_RESTAURANT", establishmentType: "RESTAURANT", stars: 1, joining: "281.250", annual: "93.750", note: "Tourist restaurant, 1 star" },
  { class: "ACTIVE_RESTAURANT", establishmentType: "RESTAURANT", stars: 2, joining: "375.000", annual: "131.250", note: "Tourist restaurant, 2 stars" },
  { class: "ACTIVE_RESTAURANT", establishmentType: "RESTAURANT", stars: 3, joining: "562.500", annual: "187.500", note: "Tourist restaurant, 3 stars" },
  { class: "ACTIVE_RESTAURANT", establishmentType: "RESTAURANT", stars: 4, joining: "750.000", annual: "281.250", note: "Tourist restaurant, 4 stars" },
  { class: "ACTIVE_RESTAURANT", establishmentType: "RESTAURANT", stars: 5, joining: "937.500", annual: "375.000", note: "Tourist restaurant, 5 stars" },

  // Flat-rate categories — the published table gives no grade breakdown.
  { class: "ACTIVE_RESTAURANT", establishmentType: "COFFEE_SHOP", stars: null, joining: "500.000", annual: "200.000", note: "كوفي شوب" },
  { class: "ACTIVE_RESTAURANT", establishmentType: "FAST_FOOD", stars: null, joining: "500.000", annual: "200.000", note: "وجبات سريعة / خدمة سريعة" },
  { class: "ACTIVE_RESTAURANT", establishmentType: "BAR", stars: null, joining: "500.000", annual: "200.000", note: "بار / ملهى / ديسكو" },
  { class: "ACTIVE_RESTAURANT", establishmentType: "NIGHTCLUB", stars: null, joining: "500.000", annual: "200.000", note: "بار / ملهى / ديسكو" },
  { class: "ACTIVE_RESTAURANT", establishmentType: "DISCO", stars: null, joining: "500.000", annual: "200.000", note: "بار / ملهى / ديسكو" },

  // Not priced in this document. Left out rather than guessed:
  //   TOURIST_PARK, ASSOCIATE_SUPPLIER, HONORARY
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const r of ROWS) {
    const existing = await db.duesSchedule.findFirst({
      where: {
        class: r.class,
        establishmentType: r.establishmentType,
        stars: r.stars,
        effectiveFrom: EFFECTIVE_FROM,
      },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await db.duesSchedule.create({
      data: {
        class: r.class,
        establishmentType: r.establishmentType,
        stars: r.stars,
        joiningAmount: new Prisma.Decimal(r.joining),
        annualAmount: new Prisma.Decimal(r.annual),
        currency: "JOD",
        effectiveFrom: EFFECTIVE_FROM,
      },
    });
    console.log(`  ${r.note.padEnd(30)} joining ${r.joining.padStart(8)}  annual ${r.annual.padStart(8)} JOD`);
    created++;
  }

  console.log(`\n${created} created, ${skipped} already present`);
  console.log("\nNot modelled (logic, not rates) — see Articles 16 and 29:");
  console.log("  · joining fee halved for establishments registered outside Amman");
  console.log("  · fees fall due in March; part of a year counts as a full year");
  console.log("  · 10% of the annual fee per month late, or part of a month");
  console.log("Not priced in the source document: TOURIST_PARK, suppliers, honorary members.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
