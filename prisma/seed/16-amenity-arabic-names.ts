/**
 * Fills Arabic names for the amenity tags, and cleans two artefacts in the
 * English ones.
 *
 * All 202 tags shipped with nameAr null, so the feature chips on every
 * restaurant profile rendered in English under an Arabic heading. This covers
 * the tags that actually carry the usage — the long tail is mostly one-off
 * labels and 7 tags attached to nothing at all.
 *
 * It does NOT merge the duplicate tags. `tv-screens` (95 uses) and `tv-screen`
 * (37), `serve-alcohol` (173) and `serves-alcohol` (21),
 * `credit-card-accepted` (433) and `accepts-credit-cards` (22),
 * `outdoor-dining` (245) and `outdoor-seating` (39) are the same thing entered
 * twice, but collapsing them rewrites which tags a restaurant holds. That is
 * the association's call, not a migration's.
 *
 *   npm run seed:amenity-ar
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const ARABIC: Record<string, string> = {
  "credit-card-accepted": "يقبل بطاقات الدفع",
  "accepts-credit-cards": "يقبل بطاقات الدفع",
  visa: "فيزا",
  "good-for-groups": "مناسب للمجموعات",
  "casual-dress": "لباس غير رسمي",
  "smart-casual": "لباس شبه رسمي",
  "outdoor-dining": "جلسات خارجية",
  "outdoor-seating": "جلسات خارجية",
  "indoor-dining": "جلسات داخلية",
  "family-place": "مناسب للعائلات",
  "kids-friendly": "مناسب للأطفال",
  "kids-meal": "وجبات أطفال",
  parking: "مواقف سيارات",
  valet: "خدمة صف السيارات",
  "soft-music": "موسيقى هادئة",
  "live-music-and-dj": "موسيقى حية ودي جيه",
  delivery: "توصيل",
  reservations: "حجوزات",
  "accept-booking": "يقبل الحجز",
  "serve-alcohol": "يقدّم مشروبات كحولية",
  "serves-alcohol": "يقدّم مشروبات كحولية",
  "smoking-and-nonsmoking-restaurant": "أقسام للمدخنين وغير المدخنين",
  "smoking-and-non-smoking-restaurant": "أقسام للمدخنين وغير المدخنين",
  "smoke-free-indoor-area": "منطقة داخلية خالية من التدخين",
  "shisha-argeeleh": "أرجيلة",
  breakfast: "فطور",
  lunch: "غداء",
  dinner: "عشاء",
  "take-away": "طلبات خارجية",
  "dine-in": "تناول الطعام في المكان",
  "outdoor-catering": "تقديم خارجي",
  "table-service": "خدمة الطاولات",
  buffet: "بوفيه",
  seating: "أماكن جلوس",
  "tv-screens": "شاشات عرض",
  "tv-screen": "شاشة عرض",
  "wheelchair-access": "مدخل لذوي الإعاقة",
  "vegetarian-food": "أطباق نباتية",
  "internet-access": "إنترنت",
  "couples-only": "للأزواج فقط",
};

async function main() {
  const tags = await db.amenityTag.findMany({
    select: { id: true, slug: true, nameEn: true, nameAr: true },
  });

  let translated = 0;
  let cleaned = 0;
  let untranslated = 0;

  for (const tag of tags) {
    const data: { nameAr?: string; nameEn?: string } = {};

    if (!tag.nameAr && ARABIC[tag.slug]) data.nameAr = ARABIC[tag.slug];

    // Several names carry a trailing bullet from the original scrape —
    // "outdoor dining •". Harmless in a list, wrong in a chip.
    const tidy = tag.nameEn.replace(/[•·]\s*$/, "").trim();
    if (tidy !== tag.nameEn) {
      data.nameEn = tidy;
      cleaned++;
    }

    if (Object.keys(data).length === 0) {
      if (!tag.nameAr) untranslated++;
      continue;
    }
    await db.amenityTag.update({ where: { id: tag.id }, data });
    if (data.nameAr) translated++;
  }

  console.log(`translated ${translated}, cleaned ${cleaned} English names`);
  console.log(`still without Arabic: ${untranslated} (long tail, mostly one-off labels)`);

  const covered = await db.amenityTag.aggregate({
    _count: true,
    where: { NOT: { nameAr: null } },
  });
  console.log(`tags with an Arabic name: ${covered._count} / ${tags.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
