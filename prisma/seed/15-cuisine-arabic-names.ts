/**
 * Fills in Arabic names for the cuisine lookup.
 *
 * All 22 cuisines shipped with nameAr null, so the Arabic site rendered
 * cuisine chips in English — on every restaurant card, every restaurant
 * profile, and the homepage hero strip. The rest of the page reads in Arabic
 * and then the cuisines do not, which is exactly the "translated, not built
 * for you" impression the design is meant to avoid.
 *
 * Keyed by slug rather than English name so a later rename upstream does not
 * silently detach the translation. Only fills nulls — an Arabic name entered
 * by an admin is never overwritten.
 *
 *   npm run seed:cuisine-ar
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const ARABIC: Record<string, string> = {
  american: "أمريكي",
  "bakeries-and-patisseries": "مخابز وحلويات",
  chinese: "صيني",
  "coffee-house": "مقاهٍ",
  "fast-food-quick-service": "وجبات سريعة",
  french: "فرنسي",
  "health-food": "أغذية صحية",
  indian: "هندي",
  international: "مأكولات عالمية",
  iraqi: "عراقي",
  italian: "إيطالي",
  "japanese-and-sushi": "ياباني وسوشي",
  lebanese: "لبناني",
  "local-jordanian-food": "مأكولات أردنية",
  others: "أخرى",
  pizza: "بيتزا",
  portuguese: "برتغالي",
  seafood: "مأكولات بحرية",
  steakhouse: "مشاوي وستيك",
  thai: "تايلندي",
  turkish: "تركي",
  // The English spelling in the source data is "Yemini"; the Arabic is correct
  // regardless, and the English is left as the association entered it.
  yemini: "يمني",
};

async function main() {
  const rows = await db.cuisine.findMany({ select: { id: true, slug: true, nameEn: true, nameAr: true } });

  let filled = 0;
  let kept = 0;
  const unmapped: string[] = [];

  for (const c of rows) {
    if (c.nameAr) {
      kept++;
      continue;
    }
    const ar = ARABIC[c.slug];
    if (!ar) {
      unmapped.push(`${c.slug} (${c.nameEn})`);
      continue;
    }
    await db.cuisine.update({ where: { id: c.id }, data: { nameAr: ar } });
    console.log(`  ${c.nameEn.padEnd(30)} -> ${ar}`);
    filled++;
  }

  console.log(`\nfilled ${filled}, already set ${kept}`);
  if (unmapped.length) console.log(`no translation mapped: ${unmapped.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
