/**
 * Digitises the five classification standards that shipped as downloadable
 * PDFs only.
 *
 * 05-classification.ts transcribed Restaurant and Bar in full and left the
 * rest flagged as follow-up. Until now, choosing "coffee shop" on the
 * classification page produced an empty evaluation — which matters, because
 * the self-assessment is the entry point for new joiners.
 *
 * Everything here is read from JRA's own PDFs in
 * `Classification of tourist restaurants/`:
 *   - section point totals, which sum exactly to each document's published
 *     grand total
 *   - the star bands printed at the foot of each document
 *
 * Granularity is deliberate. Each document breaks its sections into
 * individual criteria, but the Arabic tables extract as interleaved columns
 * and pairing a description to its point value mechanically is not reliable.
 * Rather than risk attaching the wrong marks to the wrong requirement in a
 * regulatory standard, each section is modelled as one scored item carrying
 * that section's exact published total. The totals and the resulting star
 * grade are therefore correct; the breakdown within a section is coarser than
 * Restaurant and Bar, and refining it is a transcription job against the PDFs.
 *
 * FAST_FOOD is not included. Its document scores sections as
 * (متطلب إجباري) mandatory or (متطلب اختياري) optional, which is a different
 * model from the others and needs its own schema support.
 *
 *   npm run seed:standards
 */
import { PrismaClient, type EstablishmentType } from "@prisma/client";

const db = new PrismaClient();

type Section = { code: string; nameEn: string; nameAr: string; points: number };
type Band = { stars: number; min: number; max: number };
type Standard = {
  type: EstablishmentType;
  titleEn: string;
  titleAr: string;
  sections: Section[];
  bands: Band[];
};

/** The 10-section skeleton every document shares; points differ per standard. */
const skeleton = (
  pts: readonly [number, number, number, number, number, number, number, number, number, number],
  hallEn = "Dining hall",
  hallAr = "صالة الطعام"
): Section[] => [
  { code: "building", nameEn: "Building", nameAr: "المبنى", points: pts[0] },
  { code: "parking", nameEn: "Parking", nameAr: "مواقف السيارات", points: pts[1] },
  { code: "entrances", nameEn: "Entrance types", nameAr: "أنواع المداخل", points: pts[2] },
  { code: "service", nameEn: "Service and reception", nameAr: "الخدمة والاستقبال", points: pts[3] },
  { code: "hall", nameEn: hallEn, nameAr: hallAr, points: pts[4] },
  { code: "washrooms", nameEn: "Washrooms", nameAr: "المرافق الصحية والمغاسل", points: pts[5] },
  { code: "kitchen", nameEn: "Kitchen", nameAr: "المطبخ", points: pts[6] },
  { code: "extras", nameEn: "Additional facilities", nameAr: "المرافق الإضافية", points: pts[7] },
  { code: "quality", nameEn: "Food and beverage quality", nameAr: "جودة الطعام والشراب", points: pts[8] },
  { code: "staff", nameEn: "Staff", nameAr: "العاملون", points: pts[9] },
];

const STANDARDS: Standard[] = [
  {
    type: "COFFEE_SHOP",
    titleEn: "Tourist coffee shop classification standard",
    titleAr: "مواصفات وأسس تصنيف الكوفي شوب السياحي",
    sections: skeleton([12, 3, 6, 8, 48, 13, 19, 4, 8, 17]),
    bands: [
      { stars: 1, min: 70, max: 90 },
      { stars: 2, min: 91, max: 120 },
      { stars: 3, min: 121, max: 138 },
    ],
  },
  {
    type: "DISCO",
    titleEn: "Disco classification standard",
    titleAr: "مواصفات وأسس تصنيف الديسكو",
    sections: skeleton([12, 3, 6, 2, 57, 13, 19, 3, 6, 14], "Disco hall", "صالة الديسكو"),
    bands: [
      { stars: 1, min: 60, max: 90 },
      { stars: 2, min: 91, max: 120 },
      { stars: 3, min: 121, max: 135 },
    ],
  },
  {
    type: "NIGHTCLUB",
    titleEn: "Nightclub classification standard",
    titleAr: "مواصفات وأسس تصنيف الملهى الليلي",
    sections: skeleton([12, 3, 6, 8, 66, 13, 22, 5, 10, 17], "Club hall", "صالة الملهى"),
    bands: [
      { stars: 1, min: 100, max: 120 },
      { stars: 2, min: 121, max: 141 },
      { stars: 3, min: 142, max: 162 },
    ],
  },
  {
    type: "TOURIST_PARK",
    titleEn: "Tourist park classification standard",
    titleAr: "مواصفات وأسس تصنيف المتنزهات السياحية",
    sections: skeleton([18, 3, 6, 8, 40, 13, 33, 7, 20, 23]),
    bands: [
      { stars: 1, min: 100, max: 130 },
      { stars: 2, min: 131, max: 150 },
      { stars: 3, min: 151, max: 171 },
    ],
  },
];

async function main() {
  for (const std of STANDARDS) {
    const total = std.sections.reduce((s, x) => s + x.points, 0);
    const bandMax = Math.max(...std.bands.map((b) => b.max));
    // The published grand total and the top band must agree; if they do not,
    // something was mis-transcribed and the standard should not be seeded.
    if (total !== bandMax) {
      console.log(`  SKIP ${std.type}: sections sum to ${total} but top band ends at ${bandMax}`);
      continue;
    }

    const existing = await db.classificationStandard.findFirst({
      where: { establishmentType: std.type },
    });
    if (!existing) {
      console.log(`  SKIP ${std.type}: no standard row to fill`);
      continue;
    }

    const already = await db.classificationSection.count({ where: { standardId: existing.id } });
    if (already > 0) {
      console.log(`  skip ${std.type}: already has ${already} sections`);
      continue;
    }

    await db.classificationStandard.update({
      where: { id: existing.id },
      data: { titleEn: std.titleEn, titleAr: std.titleAr, totalPossiblePoints: total },
    });

    for (const [i, sec] of std.sections.entries()) {
      const created = await db.classificationSection.create({
        data: {
          standardId: existing.id,
          code: sec.code,
          nameEn: sec.nameEn,
          nameAr: sec.nameAr,
          sortOrder: i,
        },
      });
      await db.classificationCriterion.create({
        data: {
          sectionId: created.id,
          textEn: sec.nameEn,
          textAr: sec.nameAr,
          maxPoints: sec.points,
          sortOrder: 0,
        },
      });
    }

    for (const b of std.bands) {
      await db.classificationStarBand.create({
        data: { standardId: existing.id, stars: b.stars, minScore: b.min, maxScore: b.max },
      });
    }

    console.log(
      `  ${std.type.padEnd(13)} ${std.sections.length} sections, ${total} points, ${std.bands.length} bands`
    );
  }

  console.log("\nFAST_FOOD left out: its document scores sections as mandatory or");
  console.log("optional, which the current schema cannot express.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
