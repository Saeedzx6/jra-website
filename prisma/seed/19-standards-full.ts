/**
 * Seeds every classification standard from its transcription in
 * `prisma/seed/data/`.
 *
 * This supersedes both earlier passes. 05-classification.ts transcribed
 * Restaurant and Bar as bare labels and published the other five as
 * download-only PDFs; 17-remaining-standards.ts filled four of those with one
 * scored row per section, each carrying the whole section total — so an owner
 * was asked to rate "Dining hall — 48 points" as a single item. The totals
 * were right and the question was meaningless.
 *
 * The files here carry every row of every document: its printed numbering,
 * the الوصف العام heading it sits under, the أسس التصنيف requirement, the
 * التعريف definition, and its marks, in Arabic and English.
 *
 *   npm run seed:standards-full
 *   npm run seed:standards-full -- --force   (see the answer guard below)
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { PrismaClient, type EstablishmentType, type GradingMode } from "@prisma/client";

const db = new PrismaClient();

const DATA_DIR = path.join(process.cwd(), "prisma", "seed", "data");
const PDF_DIR = "/uploads/classification";

type Bilingual = { ar: string; en: string };
type Row = {
  no: string;
  group?: Bilingual;
  basis: Bilingual;
  definition?: Bilingual;
  marks: number;
  mandatory?: boolean;
};
type Section = {
  code: string;
  no: number;
  nameEn: string;
  nameAr: string;
  max: number;
  note?: Bilingual;
  rows: Row[];
};
type Standard = {
  type: EstablishmentType;
  titleEn: string;
  titleAr: string;
  gradingMode: GradingMode;
  totalMarks: number;
  sourcePdf?: string;
  bands?: { stars: number; min: number; max: number }[];
  sections: Section[];
};

/**
 * The transcriptions are checked by the same gate that guards them in review,
 * run as a child process so there is one implementation of it rather than a
 * copy that can drift. A standard whose arithmetic does not match its own
 * printed totals must never reach the database — it would misgrade every
 * establishment assessed against it.
 */
function verifyOrExit() {
  try {
    const out = execFileSync("node", ["scripts/verify-standard-json.mjs"], {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    console.log(out.trim());
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    console.error(err.stdout ?? "");
    console.error(err.stderr ?? "");
    console.error("\n✗ Transcriptions failed verification — nothing was written.");
    process.exit(1);
  }
}

function readStandards(): Standard[] {
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json") && !f.includes("schema"))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8")) as Standard);
}

/**
 * Deterministic ids, so re-seeding updates a row in place instead of deleting
 * and recreating it. That is what lets an assessment already in progress keep
 * its answers when a translation is corrected.
 */
const sectionId = (type: string, code: string) => `${type}-${code}`;
const criterionId = (type: string, code: string, index: number) => `${type}-${code}-${index}`;

async function seedStandard(std: Standard, force: boolean) {
  const wanted = new Set<string>();
  for (const s of std.sections) {
    s.rows.forEach((_, i) => wanted.add(criterionId(std.type, s.code, i)));
  }

  const existing = await db.classificationStandard.findUnique({
    where: { establishmentType: std.type },
    include: { sections: { include: { criteria: true } } },
  });

  // Rows the new transcription no longer has. Deleting a criterion cascades to
  // every answer given against it, so an assessment someone has already filled
  // in would lose those answers silently. Refuse rather than destroy them.
  const stale = (existing?.sections ?? [])
    .flatMap((s) => s.criteria)
    .filter((c) => !wanted.has(c.id))
    .map((c) => c.id);

  if (stale.length > 0) {
    const answers = await db.assessmentAnswer.count({ where: { criterionId: { in: stale } } });
    if (answers > 0 && !force) {
      console.log(
        `  SKIP ${std.type}: ${answers} saved answer(s) sit on ${stale.length} row(s) this ` +
          `transcription replaces. Re-run with --force to discard them.`
      );
      return false;
    }
  }

  const standard = await db.classificationStandard.upsert({
    where: { establishmentType: std.type },
    update: {
      titleEn: std.titleEn,
      titleAr: std.titleAr,
      totalPossiblePoints: std.totalMarks,
      gradingMode: std.gradingMode,
      ...(std.sourcePdf ? { sourcePdfUrl: `${PDF_DIR}/${std.sourcePdf}` } : {}),
    },
    create: {
      establishmentType: std.type,
      titleEn: std.titleEn,
      titleAr: std.titleAr,
      totalPossiblePoints: std.totalMarks,
      gradingMode: std.gradingMode,
      sourcePdfUrl: std.sourcePdf ? `${PDF_DIR}/${std.sourcePdf}` : null,
    },
  });

  await db.classificationStarBand.deleteMany({ where: { standardId: standard.id } });
  for (const band of std.bands ?? []) {
    await db.classificationStarBand.create({
      data: {
        standardId: standard.id,
        minScore: band.min,
        maxScore: band.max,
        stars: band.stars,
      },
    });
  }

  for (const [sIdx, s] of std.sections.entries()) {
    const id = sectionId(std.type, s.code);
    const sectionData = {
      nameEn: s.nameEn,
      nameAr: s.nameAr,
      noteEn: s.note?.en ?? null,
      noteAr: s.note?.ar ?? null,
      sortOrder: sIdx,
    };
    await db.classificationSection.upsert({
      where: { id },
      update: sectionData,
      create: { id, standardId: standard.id, code: s.code, ...sectionData },
    });

    for (const [cIdx, row] of s.rows.entries()) {
      const cId = criterionId(std.type, s.code, cIdx);
      const criterionData = {
        code: row.no,
        groupEn: row.group?.en ?? null,
        groupAr: row.group?.ar ?? null,
        textEn: row.basis.en,
        textAr: row.basis.ar,
        detailEn: row.definition?.en ?? null,
        detailAr: row.definition?.ar ?? null,
        maxPoints: row.marks,
        mandatory: row.mandatory ?? false,
        sortOrder: cIdx,
      };
      await db.classificationCriterion.upsert({
        where: { id: cId },
        update: criterionData,
        create: { id: cId, sectionId: id, ...criterionData },
      });
    }
  }

  if (stale.length > 0) {
    await db.classificationCriterion.deleteMany({ where: { id: { in: stale } } });
  }
  // Sections the transcription dropped entirely — fast food has fewer than ten.
  await db.classificationSection.deleteMany({
    where: {
      standardId: standard.id,
      id: { notIn: std.sections.map((s) => sectionId(std.type, s.code)) },
    },
  });

  const rows = std.sections.reduce((n, s) => n + s.rows.length, 0);
  console.log(
    `  ✓ ${std.type}: ${std.sections.length} sections, ${rows} rows, ${std.totalMarks} marks` +
      (stale.length > 0 ? ` (replaced ${stale.length} old row(s))` : "")
  );
  return true;
}

async function main() {
  const force = process.argv.includes("--force");

  console.log("Verifying transcriptions...");
  verifyOrExit();

  console.log("\nSeeding standards...");
  const standards = readStandards();
  let seeded = 0;
  for (const std of standards) {
    if (await seedStandard(std, force)) seeded += 1;
  }

  console.log(`\n${seeded} of ${standards.length} standard(s) seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
