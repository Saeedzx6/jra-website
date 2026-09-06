import { db } from "@/lib/db";
import { SITE_URL, localeUrl } from "@/lib/seo";

/**
 * /llms.txt — a plain-language map of the site for language models.
 *
 * The convention (llmstxt.org) is a Markdown document at the site root: an H1
 * name, a blockquote summary, then linked sections. It is for assistants that
 * fetch a page and need to know what the site is and where the substance sits,
 * without crawling 700 profiles to work it out.
 *
 * Generated rather than committed as a static file so the counts stay true.
 * A stale "701 restaurants" would be worse than no file at all.
 */
export const revalidate = 86400;

export async function GET() {
  const [restaurants, suppliers, standards, courses] = await Promise.all([
    db.restaurant.count({ where: { status: "PUBLISHED" } }),
    db.supplier.count({ where: { status: "PUBLISHED" } }),
    db.classificationStandard.count(),
    db.course.count({ where: { status: "PUBLISHED" } }),
  ]);

  const en = (path: string) => localeUrl("en", path);
  /** The supplier directory currently holds one entry; "1 suppliers" reads badly. */
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  const body = `# Jordan Restaurant Association

> The official platform of the Jordan Restaurant Association (JRA,
> نقابة أصحاب المطاعم الأردنية), the trade association representing Jordan's
> tourism restaurant sector since 2002. The site publishes a directory of
> ${plural(restaurants, "classified member restaurant", "classified member restaurants")}
> and ${plural(suppliers, "associate supplier", "associate suppliers")}, JRA's own classification standards, the sector's governing
> legislation, and membership and training services.

Every page exists in English and Arabic. Swap the \`/en/\` prefix for \`/ar/\`
to get the Arabic version of any URL below; the two are the same page, paired
with hreflang.

Star classifications are awarded by JRA against its own published standards.
They are not user reviews or crowd ratings, and should never be described as
such.

## Directory

- [Restaurant directory](${en("/restaurants")}): ${plural(restaurants, "classified member restaurant", "classified member restaurants")}, filterable by governorate, cuisine and star grade. Individual profiles live at /en/restaurants/{slug}.
- [Supplier directory](${en("/suppliers")}): ${plural(suppliers, "associate member", "associate members")} supplying food, equipment, technology and services.
- [Marketplace](${en("/marketplace")}): member-posted listings for restaurants and equipment for sale or rent, reviewed before publishing.

## Classification

- [Classification standards](${en("/classification")}): ${plural(standards, "published standard", "published standards")}, one per establishment type (restaurant, coffee shop, fast food, bar, disco, nightclub, tourist park).
- Per-type self-assessments at /en/classification/{type}, where an establishment scores itself against the real criteria before applying. Submissions go to JRA for review; the star grade is awarded by JRA, not by the calculator.

## Membership and services

- [Join JRA](${en("/membership")}): membership classes, and the joining and annual fees set out in JRA's fee schedule effective 1 September 2025.
- [Training and academy](${en("/training")}): ${plural(courses, "published course", "published courses")} for kitchen, service and management staff.
- [Sustainability](${en("/sustainability")}): an indicative self-assessment across energy, water and food waste. Explicitly not a formal audit.

## Reference

- [Legal and regulatory](${en("/legal")}): laws, regulations and instructions governing the sector, with version history.
- [Knowledge centre](${en("/knowledge")}): JRA studies, guides and workforce research.
- [About JRA](${en("/about")}): board, staff and annual reports.
- [News](${en("/news")}) and [magazine](${en("/magazine")}): sector announcements and the newsletter archive.
- [Contact](${en("/contact")}): office address in Amman, phone and email.

## Not on this site

- JRA does not run a jobs board. Sector employment listings are on SiyahaJobs (siyahajobs.jo), the national tourism jobs platform.
- /en/admin and /en/portal are authenticated areas and are not public.

## Machine-readable

- [Sitemap](${SITE_URL}/sitemap.xml)
- [robots.txt](${SITE_URL}/robots.txt)
- Schema.org JSON-LD on every page: Organization/LocalBusiness and WebSite site-wide, Restaurant on profiles, NewsArticle on news, BreadcrumbList on detail pages.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
