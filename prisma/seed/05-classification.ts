/**
 * Seeds the Classification Hub with REAL criteria transcribed directly from
 * JRA's own PDFs (Classification of tourist restaurants/*.pdf) — not
 * invented placeholder text. Two of the eight establishment types were read
 * in full and are modeled exactly (Restaurant: 10 sections / 222 points /
 * 5-star bands; Bar: 10 sections / 164 points / 3-star bands — bars are not
 * rated to 5 stars). The remaining five real PDFs (fast food, coffee shop,
 * disco, nightclub, tourist parks) are published as downloadable standards
 * now; their section/criteria digitization is flagged as follow-up work
 * rather than fabricated here. See plan §3/§4/§5 and Section 3 schema notes.
 */
import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { assetsPath } from "./util";

const PUBLIC_DIR = path.join(process.cwd(), "public", "uploads", "classification");

function copyPdf(filename: string): string | null {
  const src = assetsPath("Classification of tourist restaurants", filename);
  if (!fs.existsSync(src)) return null;
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const dest = path.join(PUBLIC_DIR, filename);
  fs.copyFileSync(src, dest);
  return `/uploads/classification/${filename}`;
}

type Criterion = { en: string; ar: string; points: number };
type Section = { code: string; nameEn: string; nameAr: string; items: Criterion[] };

const RESTAURANT_SECTIONS: Section[] = [
  {
    code: "building",
    nameEn: "Building",
    nameAr: "المبنى",
    items: [
      { en: "Architecture & facade design", ar: "الهندسة المعمارية والواجهات", points: 10 },
      { en: "Signage", ar: "لافتة", points: 2 },
      { en: "Illuminated price list board at entrance", ar: "لائحة أسعار", points: 3 },
      { en: "Special features", ar: "ميزات خاصة", points: 2 },
    ],
  },
  {
    code: "parking",
    nameEn: "Parking",
    nameAr: "مواقف السيارات",
    items: [
      { en: "Adequate dedicated parking spaces", ar: "مواقف مخصصة كافية", points: 2 },
      { en: "Valet service to the main entrance", ar: "خدمة التوصيل من السيارة (valet)", points: 1 },
    ],
  },
  {
    code: "entrances",
    nameEn: "Entrance Types",
    nameAr: "أنواع المداخل",
    items: [
      { en: "Dedicated customer entrance", ar: "مدخل خاص بالزبائن", points: 2 },
      { en: "Dedicated service entrance", ar: "مدخل الخدمات", points: 2 },
      { en: "Accessible entrance for people with disabilities", ar: "مدخل خاص لذوي الإعاقة", points: 2 },
      { en: "Special features", ar: "ميزات خاصة", points: 2 },
    ],
  },
  {
    code: "reception",
    nameEn: "Reception",
    nameAr: "الاستقبال",
    items: [
      { en: "Door-to-table greeting service", ar: "خدمة من الباب إلى الطاولة", points: 2 },
      { en: "Indoor-to-table service", ar: "خدمة بالداخل إلى الطاولة", points: 2 },
      { en: "Dedicated reception/waiting area", ar: "منطقة الاستقبال", points: 2 },
      { en: "Special features", ar: "ميزات خاصة", points: 2 },
    ],
  },
  {
    code: "dining-hall",
    nameEn: "Dining Hall",
    nameAr: "صالة الطعام",
    items: [
      { en: "Flooring quality", ar: "أرضية الصالة", points: 8 },
      { en: "Table quality", ar: "نوعية الطاولات", points: 9 },
      { en: "Seating quality", ar: "نوعية المقاعد", points: 9 },
      { en: "Linens & towels", ar: "الشراشف والفوط", points: 6 },
      { en: "Silverware (forks, knives, spoons)", ar: "الفضيات", points: 7 },
      { en: "Glassware & tableware", ar: "الزجاجيات (الكاسات والأطباق)", points: 7 },
      { en: "Decor", ar: "الديكورات", points: 14 },
      { en: "Curtains", ar: "الستائر", points: 2 },
      { en: "Heating & cooling", ar: "التدفئة والتبريد", points: 8 },
      { en: "Bilingual menu with prices", ar: "قائمة الطعام", points: 3 },
      { en: "Ventilation", ar: "وسائل التهوية", points: 3 },
      { en: "Sound insulation", ar: "نظام العزل الصوتي", points: 3 },
      { en: "Lighting", ar: "الإنارة", points: 2 },
      { en: "Special features", ar: "ميزات خاصة", points: 2 },
    ],
  },
  {
    code: "restrooms",
    nameEn: "Restrooms & Sinks",
    nameAr: "المرافق الصحية والمغاسل",
    items: [
      { en: "Separate restrooms for men and women, well-fitted", ar: "مرافق صحية منفصلة للرجال والنساء", points: 1 },
      { en: "Toilet paper holder, spare roll, covered bin", ar: "حاملة ورق تواليت وسلة مهملات", points: 1 },
      { en: "Tiled walls, ceramic floor", ar: "الجدران والأرضية", points: 1 },
      { en: "Adequate covered lighting", ar: "الإنارة الكافية", points: 1 },
      { en: "Air freshener", ar: "ماكنة تعطير", points: 1 },
      { en: "Adequate ventilation", ar: "وسائل التهوية", points: 1 },
      { en: "Sink material with hot & cold water", ar: "المغاسل", points: 1 },
      { en: "Well-lit mirror", ar: "مرآة جيدة", points: 1 },
      { en: "Liquid soap", ar: "الصابون السائل", points: 1 },
      { en: "Paper towels or electric hand dryer", ar: "محارم ورقية أو مجفف", points: 1 },
      { en: "Bin under the sink", ar: "سلة مهملات تحت المغسلة", points: 1 },
      { en: "Special features", ar: "ميزات خاصة", points: 2 },
    ],
  },
  {
    code: "kitchen",
    nameEn: "Kitchen",
    nameAr: "المطبخ",
    items: [
      { en: "Adequate space & full equipment layout", ar: "تجهيزات المطبخ وتقسيماته", points: 8 },
      { en: "Kitchen & staff cleanliness", ar: "نظافة المطبخ والعاملين به", points: 2 },
      { en: "Stainless steel tables", ar: "طاولات ستانلس", points: 2 },
      { en: "Extraction hoods & filters", ar: "شفاطات ومناخل", points: 2 },
      { en: "Running hot & cold water", ar: "مياه ساخنة وباردة", points: 2 },
      { en: "Cooking equipment & utensils", ar: "توفر المعدات والأواني", points: 6 },
      { en: "Qualified head chef", ar: "رئيس الطهاة", points: 2 },
      { en: "Cold storage / dry storage", ar: "توفر المستودعات", points: 3 },
      { en: "Kitchen zoning (prep away from heat)", ar: "تقسيمات المطبخ", points: 4 },
      { en: "Special features", ar: "ميزات خاصة", points: 2 },
    ],
  },
  {
    code: "additional-facilities",
    nameEn: "Additional Facilities",
    nameAr: "المرافق الإضافية",
    items: [
      { en: "Music distribution corner", ar: "ركن خاص بالتوزيع الموسيقي", points: 2 },
      { en: "Admin & accounting office", ar: "مكتب الإدارة والمحاسبة", points: 2 },
      { en: "Shisha preparation corner", ar: "ركن خاص لتحضير الأرجيلة", points: 2 },
      { en: "Storage", ar: "مستودعات للتخزين", points: 2 },
      { en: "Special features", ar: "ميزات خاصة", points: 2 },
    ],
  },
  {
    code: "food-quality",
    nameEn: "Food & Beverage Quality",
    nameAr: "جودة الطعام والشراب",
    items: [
      { en: "Ingredient quality, preparation method, and taste (judged periodically)", ar: "نوعية جودة الطعام والشراب", points: 20 },
    ],
  },
  {
    code: "staff",
    nameEn: "Staff",
    nameAr: "العاملون",
    items: [
      { en: "Restaurant management (dedicated, qualified manager)", ar: "إدارة المطعم", points: 6 },
      { en: "Hall manager qualifications", ar: "مدير القاعة", points: 2 },
      { en: "Staff uniform", ar: "الزي الخاص بالعاملين", points: 2 },
      { en: "General appearance & health fitness", ar: "الشكل العام واللياقة الصحية", points: 2 },
      { en: "Academic/professional qualifications", ar: "المؤهلات العلمية", points: 3 },
      { en: "Adequate staff count for all sections", ar: "عدد كافٍ من العاملين", points: 8 },
      { en: "Staff changing room", ar: "مكان خاص لتبديل الملابس", points: 2 },
      { en: "Special features", ar: "ميزات خاصة", points: 2 },
    ],
  },
];

const BAR_SECTIONS: Section[] = [
  {
    code: "building",
    nameEn: "Building",
    nameAr: "المبنى",
    items: [
      { en: "Architecture & facade design", ar: "الهندسة المعمارية والواجهات", points: 6 },
      { en: "Signage", ar: "لافتة", points: 2 },
      { en: "Illuminated price list board", ar: "لائحة أسعار", points: 2 },
      { en: "Special features", ar: "ميزات خاصة", points: 2 },
    ],
  },
  {
    code: "parking",
    nameEn: "Parking",
    nameAr: "مواقف السيارات",
    items: [
      { en: "Adequate dedicated parking spaces", ar: "مواقف مخصصة كافية", points: 2 },
      { en: "Valet service", ar: "خدمة التوصيل (valet)", points: 1 },
    ],
  },
  {
    code: "entrances",
    nameEn: "Entrance Types",
    nameAr: "أنواع المداخل",
    items: [
      { en: "Dedicated customer entrance", ar: "مدخل خاص بالزبائن", points: 2 },
      { en: "Dedicated service entrance", ar: "مدخل الخدمات", points: 2 },
      { en: "Special features", ar: "ميزات خاصة", points: 2 },
    ],
  },
  {
    code: "reception",
    nameEn: "Reception",
    nameAr: "الاستقبال",
    items: [
      { en: "Door-to-table greeting service", ar: "خدمة من الباب إلى الطاولة", points: 2 },
      { en: "Indoor-to-table service", ar: "خدمة بالداخل إلى الطاولة", points: 2 },
      { en: "Dedicated reception/waiting area", ar: "منطقة الاستقبال", points: 2 },
      { en: "Special features", ar: "ميزات خاصة", points: 2 },
    ],
  },
  {
    code: "dining-hall",
    nameEn: "Bar Hall",
    nameAr: "صالة البار",
    items: [
      { en: "Flooring quality", ar: "أرضية الصالة", points: 6 },
      { en: "Table quality", ar: "نوعية الطاولات", points: 6 },
      { en: "Seating quality", ar: "نوعية المقاعد", points: 6 },
      { en: "Silverware", ar: "الفضيات", points: 4 },
      { en: "Glassware & tableware", ar: "الزجاجيات", points: 6 },
      { en: "Decor", ar: "الديكورات", points: 8 },
      { en: "Curtains", ar: "الستائر", points: 6 },
      { en: "Heating & cooling", ar: "التدفئة والتبريد", points: 6 },
      { en: "Bilingual menu with prices", ar: "قائمة الطعام", points: 2 },
      { en: "Ventilation", ar: "وسائل التهوية", points: 4 },
      { en: "Sound insulation", ar: "نظام العزل الصوتي", points: 4 },
      { en: "Lighting", ar: "الإنارة", points: 2 },
      { en: "Bar counter, sized to the hall with fridges & shelving", ar: "كاونتر البار", points: 8 },
      { en: "Qualified bartender (Bar Man)", ar: "مجهز المشروبات", points: 2 },
      { en: "Special features", ar: "ميزات خاصة", points: 2 },
    ],
  },
  {
    code: "restrooms",
    nameEn: "Restrooms & Sinks",
    nameAr: "المرافق الصحية والمغاسل",
    items: [
      { en: "Separate restrooms for men and women, well-fitted", ar: "مرافق صحية منفصلة للرجال والنساء", points: 1 },
      { en: "Toilet paper holder, spare roll, covered bin", ar: "حاملة ورق تواليت وسلة مهملات", points: 1 },
      { en: "Tiled walls, ceramic floor", ar: "الجدران والأرضية", points: 1 },
      { en: "Adequate covered lighting", ar: "الإنارة الكافية", points: 1 },
      { en: "Air freshener", ar: "ماكنة تعطير", points: 1 },
      { en: "Adequate ventilation", ar: "وسائل التهوية", points: 1 },
      { en: "Sink material with hot & cold water", ar: "المغاسل", points: 1 },
      { en: "Well-lit mirror", ar: "مرآة جيدة", points: 1 },
      { en: "Liquid soap", ar: "الصابون السائل", points: 1 },
      { en: "Paper towels or electric hand dryer", ar: "محارم ورقية أو مجفف", points: 1 },
      { en: "Bin under the sink", ar: "سلة مهملات تحت المغسلة", points: 1 },
      { en: "Special features", ar: "ميزات خاصة", points: 2 },
    ],
  },
  {
    code: "kitchen",
    nameEn: "Kitchen",
    nameAr: "المطبخ",
    items: [
      { en: "Adequate space & full equipment layout", ar: "تجهيزات المطبخ وتقسيماته", points: 6 },
      { en: "Kitchen & staff cleanliness", ar: "نظافة المطبخ والعاملين به", points: 1 },
      { en: "Stainless steel tables", ar: "طاولات ستانلس", points: 2 },
      { en: "Extraction hoods & filters", ar: "شفاطات ومناخل", points: 1 },
      { en: "Running hot water", ar: "مياه ساخنة", points: 1 },
      { en: "Cooking equipment & utensils", ar: "توفر المعدات والأواني", points: 4 },
      { en: "Storage", ar: "توفر المستودعات", points: 2 },
      { en: "Kitchen zoning", ar: "تقسيمات المطبخ", points: 3 },
      { en: "Special features", ar: "ميزات خاصة", points: 2 },
    ],
  },
  {
    code: "additional-facilities",
    nameEn: "Additional Facilities",
    nameAr: "المرافق الإضافية",
    items: [
      { en: "Admin & accounting office", ar: "مكتب الإدارة والمحاسبة", points: 1 },
      { en: "Storage", ar: "مستودعات للتخزين", points: 1 },
      { en: "Special features", ar: "ميزات خاصة", points: 1 },
    ],
  },
  {
    code: "food-quality",
    nameEn: "Food & Beverage Quality",
    nameAr: "جودة الطعام والشراب",
    items: [
      { en: "Ingredient quality, preparation method, and taste (judged periodically)", ar: "نوعية وجودة الطعام والشراب", points: 8 },
    ],
  },
  {
    code: "staff",
    nameEn: "Staff",
    nameAr: "العاملون",
    items: [
      { en: "Bar management (dedicated, qualified manager)", ar: "إدارة البار", points: 3 },
      { en: "Hall manager qualifications", ar: "مدير القاعة", points: 1 },
      { en: "Staff uniform", ar: "الزي الخاص بالعاملين", points: 2 },
      { en: "General appearance & health fitness", ar: "الشكل العام واللياقة الصحية", points: 1 },
      { en: "Academic/professional qualifications", ar: "المؤهلات العلمية", points: 2 },
      { en: "Adequate staff count", ar: "عدد كافٍ من العاملين", points: 2 },
      { en: "Staff changing room", ar: "مكان خاص لتبديل الملابس", points: 4 },
      { en: "Special features", ar: "ميزات خاصة", points: 2 },
    ],
  },
];

async function seedStandard(
  type: "RESTAURANT" | "BAR",
  titleEn: string,
  titleAr: string,
  pdfFilename: string,
  sections: Section[],
  starBands: { min: number; max: number; stars: number }[]
) {
  const totalPoints = sections.reduce(
    (sum, s) => sum + s.items.reduce((a, c) => a + c.points, 0),
    0
  );
  const sourcePdfUrl = copyPdf(pdfFilename);

  const standard = await db.classificationStandard.upsert({
    where: { establishmentType: type },
    update: { titleEn, titleAr, sourcePdfUrl, totalPossiblePoints: totalPoints },
    create: {
      establishmentType: type,
      titleEn,
      titleAr,
      sourcePdfUrl,
      totalPossiblePoints: totalPoints,
    },
  });

  await db.classificationStarBand.deleteMany({ where: { standardId: standard.id } });
  for (const band of starBands) {
    await db.classificationStarBand.create({
      data: { standardId: standard.id, minScore: band.min, maxScore: band.max, stars: band.stars },
    });
  }

  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const s = sections[sIdx]!;
    const section = await db.classificationSection.upsert({
      where: { id: `${type}-${s.code}` },
      update: { nameEn: s.nameEn, nameAr: s.nameAr, sortOrder: sIdx },
      create: {
        id: `${type}-${s.code}`,
        standardId: standard.id,
        code: s.code,
        nameEn: s.nameEn,
        nameAr: s.nameAr,
        sortOrder: sIdx,
      },
    });

    for (let cIdx = 0; cIdx < s.items.length; cIdx++) {
      const c = s.items[cIdx]!;
      await db.classificationCriterion.upsert({
        where: { id: `${type}-${s.code}-${cIdx}` },
        update: { textEn: c.en, textAr: c.ar, maxPoints: c.points, sortOrder: cIdx },
        create: {
          id: `${type}-${s.code}-${cIdx}`,
          sectionId: section.id,
          textEn: c.en,
          textAr: c.ar,
          maxPoints: c.points,
          sortOrder: cIdx,
        },
      });
    }
  }

  console.log(`✓ ${type}: ${sections.length} sections, ${totalPoints} total points`);
}

/** The remaining 5 real PDFs — standards library only for now (see file header). */
const PENDING_TYPES: { type: "FAST_FOOD" | "COFFEE_SHOP" | "DISCO" | "NIGHTCLUB" | "TOURIST_PARK"; titleEn: string; titleAr: string; pdf: string }[] = [
  {
    type: "FAST_FOOD",
    titleEn: "Fast Food / Quick Service Restaurant Classification Standards",
    titleAr: "مواصفات وأسس تصنيف مطاعم الوجبات السريعة أو الخدمة السريعة",
    pdf: "مواصفات_واسس_تصنيف_مطاعم_الوجبات_السريعة_او_الخدمة_السريعة.pdf",
  },
  {
    type: "COFFEE_SHOP",
    titleEn: "Tourist Coffee Shop Classification Standards",
    titleAr: "مواصفات واسس تصنيف الكوفي شوب السياحي",
    pdf: "مواصفات_واسس_تصنيف_الكوفي_الشوب_السياحي-0.pdf",
  },
  {
    type: "DISCO",
    titleEn: "Disco Classification Standards",
    titleAr: "مواصفات واسس تصنيف الديسكو",
    pdf: "مواصفات_واسس_تصنيف_الديسكو.pdf",
  },
  {
    type: "NIGHTCLUB",
    titleEn: "Nightclub Classification Standards",
    titleAr: "مواصفات وأسس تصنيف الملهى الليلي",
    pdf: "مواصفات_وأسس_تصنيف_الملهى_الليلي.pdf",
  },
  {
    type: "TOURIST_PARK",
    titleEn: "Tourist Park Classification Standards",
    titleAr: "مواصفات واسس تصنيف المتنزهات السياحية",
    pdf: "مواصفات_واسس_تصنيف_المتنزهات_السياحية.pdf",
  },
];

async function main() {
  await seedStandard(
    "RESTAURANT",
    "Restaurant Classification Standards",
    "مواصفات واسس تصنيف المطعم",
    "مواصفات_واسس_تصنيف_المطعم.pdf",
    RESTAURANT_SECTIONS,
    [
      { min: 100, max: 140, stars: 1 },
      { min: 141, max: 170, stars: 2 },
      { min: 171, max: 190, stars: 3 },
      { min: 191, max: 210, stars: 4 },
      { min: 211, max: 222, stars: 5 },
    ]
  );

  await seedStandard(
    "BAR",
    "Bar Classification Standards",
    "مواصفات واسس تصنيف البار",
    "مواصفات_واسس_تصنيف_البار-0.pdf",
    BAR_SECTIONS,
    [
      { min: 100, max: 120, stars: 1 },
      { min: 121, max: 141, stars: 2 },
      { min: 142, max: 164, stars: 3 },
    ]
  );

  for (const p of PENDING_TYPES) {
    const sourcePdfUrl = copyPdf(p.pdf);
    await db.classificationStandard.upsert({
      where: { establishmentType: p.type },
      update: { titleEn: p.titleEn, titleAr: p.titleAr, sourcePdfUrl },
      create: {
        establishmentType: p.type,
        titleEn: p.titleEn,
        titleAr: p.titleAr,
        sourcePdfUrl,
        totalPossiblePoints: 0,
      },
    });
  }
  console.log(`✓ published ${PENDING_TYPES.length} additional real standards (PDF only — criteria digitization pending)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
