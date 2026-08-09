/**
 * Seeds News & Events, About JRA (board + team), Annual Reports, and the
 * Knowledge Center `resources` pool (JRA Publications, Workforce studies,
 * HR Manuals, root-level guides, Newspapers → initial Magazine archive).
 * See plan §4 Step 5. Classification PDFs are handled separately by
 * 05-classification.ts since they also seed the scoring engine.
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { db } from "@/lib/db";
import { assetsPath, makeUniqueSlugger, slugify } from "./util";

const PUBLIC_DIR = path.join(process.cwd(), "public", "uploads");

function copyIntoPublic(srcPath: string, subdir: string): string {
  const destDir = path.join(PUBLIC_DIR, subdir);
  fs.mkdirSync(destDir, { recursive: true });
  const filename = path.basename(srcPath);
  const destPath = path.join(destDir, filename);
  fs.copyFileSync(srcPath, destPath);
  return `/uploads/${subdir}/${filename}`.replace(/\\/g, "/");
}

function looksArabic(text: string): boolean {
  return /[؀-ۿ]/.test(text);
}

async function seedNews() {
  const csvPath = assetsPath("jra_news_data.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows: { Date: string; Title: string; Summary: string; Article_URL: string }[] = parse(
    raw,
    { columns: true, skip_empty_lines: true }
  );

  const nextSlug = makeUniqueSlugger();
  let count = 0;

  for (const row of rows) {
    if (!row.Title) continue;
    const slug = nextSlug(row.Title);
    const publishedAt = new Date(row.Date);
    const bodyHtml = row.Summary
      ? row.Summary
          .split("\n")
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => `<p>${p}</p>`)
          .join("")
      : `<p>${row.Title}</p>`;
    const excerpt = row.Summary ? row.Summary.replace(/\s+/g, " ").trim().slice(0, 220) : null;

    const article = await db.newsArticle.upsert({
      where: { slug },
      update: {
        status: "PUBLISHED",
        publishedAt: isNaN(publishedAt.getTime()) ? null : publishedAt,
        sourceUrl: row.Article_URL ?? null,
      },
      create: {
        slug,
        category: "NEWS",
        status: "PUBLISHED",
        publishedAt: isNaN(publishedAt.getTime()) ? null : publishedAt,
        sourceUrl: row.Article_URL ?? null,
      },
    });

    await db.newsTranslation.upsert({
      where: { newsArticleId_locale: { newsArticleId: article.id, locale: "en" } },
      update: { title: row.Title, bodyHtml, excerpt },
      create: { newsArticleId: article.id, locale: "en", title: row.Title, bodyHtml, excerpt },
    });
    count++;
  }
  console.log(`✓ news articles: ${count}`);
}

function filenameToName(base: string): string {
  return base.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, "'").trim();
}

async function seedBoardMembers() {
  const dir = assetsPath("Board members");
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f));

  let order = 0;
  for (const file of files) {
    const base = path.basename(file, path.extname(file));
    const name = filenameToName(base);
    const photoUrl = copyIntoPublic(path.join(dir, file), "people");

    await db.person.upsert({
      where: { id: `board-${slugify(name)}` },
      update: { name, photoUrl, sortOrder: order },
      create: {
        id: `board-${slugify(name)}`,
        kind: "BOARD_MEMBER",
        name,
        positionEn: "Board Member",
        photoUrl,
        sortOrder: order,
      },
    });
    order++;
  }
  console.log(`✓ board members: ${files.length}`);
}

async function seedStaff() {
  const teamDir = assetsPath("JRA Team");
  const txtPath = path.join(teamDir, "JRA Team.txt");
  if (!fs.existsSync(txtPath)) return;

  const lines = fs
    .readFileSync(txtPath, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  type Record_ = { name: string; title?: string; email?: string };
  const records: Record_[] = [];
  let i = 0;
  while (i < lines.length) {
    const name = lines[i]!;
    const title = lines[i + 1];
    const maybeEmail = lines[i + 2];
    if (maybeEmail?.toLowerCase().startsWith("email:")) {
      records.push({ name, title, email: maybeEmail.split(":").slice(1).join(":").trim() });
      i += 3;
    } else {
      records.push({ name, title });
      i += 2;
    }
  }

  const photoAliases: Record<string, string> = {
    Mohamad: "Eng. Mohammad.png",
    Muna: "Mona.png",
  };

  let order = 0;
  for (const rec of records) {
    if (!rec.name) continue;
    const firstWord = rec.name.replace(/^Eng\.\s*/i, "").split(" ")[0]!;
    const candidate = photoAliases[firstWord] ?? `${firstWord}.png`;
    const candidatePath = path.join(teamDir, candidate);
    const photoUrl = fs.existsSync(candidatePath)
      ? copyIntoPublic(candidatePath, "people")
      : null;

    await db.person.upsert({
      where: { id: `staff-${slugify(rec.name)}` },
      update: { name: rec.name, positionEn: rec.title ?? null, email: rec.email, photoUrl, sortOrder: order },
      create: {
        id: `staff-${slugify(rec.name)}`,
        kind: "STAFF",
        name: rec.name,
        positionEn: rec.title ?? null,
        email: rec.email,
        photoUrl,
        sortOrder: order,
      },
    });
    order++;
  }
  console.log(`✓ staff: ${records.length}`);
}

async function seedResourceFolder(
  dir: string,
  type: "ANNUAL_REPORT" | "STUDY" | "GUIDE" | "HR_MANUAL",
  subdir: string
) {
  if (!fs.existsSync(dir)) return 0;
  const files = fs.readdirSync(dir).filter((f) => /\.(pdf|docx|pptx)$/i.test(f));
  const nextSlug = makeUniqueSlugger();

  for (const file of files) {
    const base = path.basename(file, path.extname(file));
    const slug = nextSlug(`${type}-${base}`);
    const fileUrl = copyIntoPublic(path.join(dir, file), subdir);
    const locale = looksArabic(base) ? "ar" : "en";

    const resource = await db.resource.upsert({
      where: { slug },
      update: { fileUrl, status: "PUBLISHED" },
      create: { slug, type, fileUrl, status: "PUBLISHED" },
    });

    await db.resourceTranslation.upsert({
      where: { resourceId_locale: { resourceId: resource.id, locale } },
      update: { title: base },
      create: { resourceId: resource.id, locale, title: base },
    });
  }
  return files.length;
}

async function seedMagazineFromNewspapers() {
  const dir = assetsPath("Newspapers");
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter((f) => /\.pdf$/i.test(f));

  for (let i = 0; i < files.length; i++) {
    const pdfUrl = copyIntoPublic(path.join(dir, files[i]!), "magazine");
    await db.magazineIssue.upsert({
      where: { id: `newsletter-${i + 1}` },
      update: { pdfUrl, status: "PUBLISHED" },
      create: {
        id: `newsletter-${i + 1}`,
        issueNumber: i + 1,
        month: (i % 12) + 1,
        year: 2025,
        pdfUrl,
        status: "PUBLISHED",
      },
    });
  }
  console.log(`✓ magazine issues (from Newspapers/): ${files.length}`);
}

async function main() {
  await seedNews();
  await seedBoardMembers();
  await seedStaff();

  const reportCount = await seedResourceFolder(
    assetsPath("Annual reports"),
    "ANNUAL_REPORT",
    "resources/annual-reports"
  );
  console.log(`✓ annual reports: ${reportCount}`);

  const pubCount = await seedResourceFolder(
    assetsPath("JRA Publications"),
    "STUDY",
    "resources/publications"
  );
  const workforceCount = await seedResourceFolder(
    assetsPath("Workforce studies"),
    "STUDY",
    "resources/workforce-studies"
  );
  console.log(`✓ studies/publications: ${pubCount + workforceCount}`);

  const hrCount = await seedResourceFolder(
    assetsPath("HR Manuals"),
    "HR_MANUAL",
    "resources/hr-manuals"
  );
  console.log(`✓ HR manuals: ${hrCount}`);

  await seedMagazineFromNewspapers();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
