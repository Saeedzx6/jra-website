/**
 * The gate on transcribed classification standards.
 *
 * Each file in prisma/seed/data/ is a hand transcription of one of JRA's
 * published classification PDFs. These are regulatory documents: a mark
 * attached to the wrong requirement misgrades a real business, and the
 * arithmetic is the only mechanical check available on a transcription that
 * otherwise has to be trusted. So the published totals are checked three ways
 * — rows against their section, sections against the grand total, grand total
 * against the top star band — and any disagreement fails the file rather than
 * seeding something that scores wrongly.
 *
 *   node scripts/verify-standard-json.mjs            # every file
 *   node scripts/verify-standard-json.mjs coffee-shop.json
 */
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "prisma", "seed", "data");

const TYPES = [
  "RESTAURANT",
  "FAST_FOOD",
  "COFFEE_SHOP",
  "BAR",
  "DISCO",
  "NIGHTCLUB",
  "TOURIST_PARK",
];

/**
 * Every document shares this 10-section skeleton, which is what lets one icon
 * set and one set of section labels serve all seven standards. A transcription
 * that invents its own section code would render without an icon.
 */
const SECTION_CODES = [
  "building",
  "parking",
  "entrances",
  "service",
  "hall",
  "washrooms",
  "kitchen",
  "extras",
  "quality",
  "staff",
];

/** A dash is how the documents themselves write "no basis stated" for e.g. ميزات خاصة. */
const DASH = "—";

function isText(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function bilingual(v) {
  return v && typeof v === "object" && isText(v.ar) && isText(v.en);
}

function verify(file) {
  const errors = [];
  const warnings = [];
  const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf8");

  let std;
  try {
    std = JSON.parse(raw);
  } catch (e) {
    return { errors: [`not valid JSON: ${e.message}`], warnings, std: null };
  }

  const err = (m) => errors.push(m);

  // --- shape -------------------------------------------------------------
  if (!TYPES.includes(std.type)) err(`type must be one of ${TYPES.join(", ")}, got ${std.type}`);
  if (!isText(std.titleEn)) err("titleEn is required");
  if (!isText(std.titleAr)) err("titleAr is required");
  if (std.gradingMode !== "STARS" && std.gradingMode !== "CERTIFICATION") {
    err(`gradingMode must be STARS or CERTIFICATION, got ${std.gradingMode}`);
  }
  if (typeof std.totalMarks !== "number" || std.totalMarks <= 0) {
    err("totalMarks must be a positive number");
  }
  if (!Array.isArray(std.sections) || std.sections.length === 0) {
    err("sections is required");
    return { errors, warnings, std };
  }

  // --- sections and rows -------------------------------------------------
  const seenCodes = new Set();
  const seenNos = new Set();
  let sectionMaxSum = 0;
  let rowCount = 0;
  let mandatoryMarks = 0;

  for (const s of std.sections) {
    const where = `section ${s.code ?? "?"}`;

    if (!SECTION_CODES.includes(s.code)) {
      err(`${where}: code must be one of ${SECTION_CODES.join(", ")}`);
    }
    if (seenCodes.has(s.code)) err(`${where}: duplicate section code`);
    seenCodes.add(s.code);

    if (!isText(s.nameEn)) err(`${where}: nameEn is required`);
    if (!isText(s.nameAr)) err(`${where}: nameAr is required`);
    if (s.note !== undefined && !bilingual(s.note)) {
      err(`${where}: note, when present, needs non-empty ar and en`);
    }
    if (typeof s.max !== "number" || s.max < 0) err(`${where}: max must be a number`);
    if (!Array.isArray(s.rows) || s.rows.length === 0) {
      err(`${where}: has no rows`);
      continue;
    }

    let rowSum = 0;
    for (const r of s.rows) {
      rowCount += 1;
      const at = `${where} row ${r.no ?? "?"}`;

      if (typeof r.marks !== "number" || r.marks < 0) {
        err(`${at}: marks must be a number >= 0`);
      } else {
        rowSum += r.marks;
        if (r.mandatory === true) mandatoryMarks += r.marks;
      }

      if (!bilingual(r.basis)) err(`${at}: basis needs non-empty ar and en`);
      if (r.definition !== undefined && !bilingual(r.definition)) {
        err(`${at}: definition, when present, needs non-empty ar and en`);
      }

      // A row whose basis is only a dash carries no requirement text of its
      // own, so its group heading is the only thing naming it on screen.
      const basisIsDash = r.basis?.ar?.trim() === DASH || r.basis?.en?.trim() === DASH;
      if (basisIsDash && !bilingual(r.group)) {
        err(`${at}: basis is "${DASH}", so group must name the requirement`);
      }

      if (isText(r.no)) {
        if (seenNos.has(r.no)) err(`${at}: duplicate row number`);
        seenNos.add(r.no);
      } else {
        err(`${at}: no (the printed numbering, e.g. "1.2") is required`);
      }

      if (r.mandatory !== undefined && typeof r.mandatory !== "boolean") {
        err(`${at}: mandatory must be a boolean`);
      }
    }

    // The arithmetic that matters most.
    if (typeof s.max === "number" && rowSum !== s.max) {
      err(`${where}: rows sum to ${rowSum} but the document prints ${s.max}`);
    }
    sectionMaxSum += typeof s.max === "number" ? s.max : 0;
  }

  if (sectionMaxSum !== std.totalMarks) {
    err(`sections sum to ${sectionMaxSum} but totalMarks is ${std.totalMarks}`);
  }

  // --- grading -----------------------------------------------------------
  if (std.gradingMode === "STARS") {
    if (!Array.isArray(std.bands) || std.bands.length === 0) {
      err("a STARS standard needs bands");
    } else {
      const bands = [...std.bands].sort((a, b) => a.min - b.min);
      for (const b of bands) {
        if (typeof b.stars !== "number" || typeof b.min !== "number" || typeof b.max !== "number") {
          err(`band ${JSON.stringify(b)}: stars, min and max must be numbers`);
          continue;
        }
        if (b.min > b.max) err(`band ${b.stars}: min ${b.min} is above max ${b.max}`);
      }
      for (let i = 1; i < bands.length; i++) {
        if (bands[i].min <= bands[i - 1].max) {
          err(`band ${bands[i].stars} starts at ${bands[i].min}, overlapping band ${bands[i - 1].stars}`);
        }
      }
      const top = bands[bands.length - 1];
      if (top && top.max !== std.totalMarks) {
        err(`top band ends at ${top.max} but the standard totals ${std.totalMarks}`);
      }
    }
  } else {
    if (Array.isArray(std.bands) && std.bands.length > 0) {
      err("a CERTIFICATION standard has no star bands");
    }
    if (mandatoryMarks === 0) {
      err("a CERTIFICATION standard needs mandatory rows");
    } else if (mandatoryMarks !== std.totalMarks) {
      err(`mandatory rows carry ${mandatoryMarks} marks but totalMarks is ${std.totalMarks}`);
    }
  }

  // --- worth a look, but not a failure -----------------------------------
  const missingSections = SECTION_CODES.filter((c) => !seenCodes.has(c));
  if (missingSections.length > 0) {
    warnings.push(`no ${missingSections.join(", ")} section — check the document really omits it`);
  }
  const noDefinition = std.sections.flatMap((s) =>
    (s.rows ?? []).filter((r) => !r.definition).map((r) => r.no)
  );
  if (noDefinition.length > 0) {
    warnings.push(`${noDefinition.length} row(s) without a definition: ${noDefinition.join(", ")}`);
  }

  return { errors, warnings, std, rowCount };
}

const requested = process.argv.slice(2);
const files = requested.length
  ? requested.map((f) => path.basename(f))
  : fs.existsSync(DATA_DIR)
    ? fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json") && !f.includes("schema"))
    : [];

if (files.length === 0) {
  console.error(`✗ no standard files found in ${DATA_DIR}`);
  process.exit(1);
}

let failed = 0;
for (const file of files.sort()) {
  const { errors, warnings, std, rowCount } = verify(file);
  if (errors.length === 0) {
    console.log(
      `✓ ${file} — ${std.type}: ${std.sections.length} sections, ${rowCount} rows, ${std.totalMarks} marks` +
        (std.gradingMode === "STARS" ? `, ${std.bands.length}-star bands` : ", certification")
    );
  } else {
    failed += 1;
    console.log(`✗ ${file}`);
    for (const e of errors) console.log(`    ${e}`);
  }
  for (const w of warnings) console.log(`    ! ${w}`);
}

console.log(
  failed === 0
    ? `\n${files.length} standard(s) verified.`
    : `\n${failed} of ${files.length} standard(s) failed.`
);
process.exit(failed === 0 ? 0 : 1);
