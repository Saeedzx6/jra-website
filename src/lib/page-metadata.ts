import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";

/**
 * Metadata factory for the static public pages.
 *
 * Before this, only the two detail routes declared their own metadata. Every
 * other page inherited the locale layout's — which meant they shared one title,
 * one description, and, worse, one canonical URL pointing at the homepage.
 * A canonical that points somewhere else is an instruction to search engines
 * not to index the page it is on, so twenty-two pages were asking to be
 * dropped from the index.
 *
 * Kept out of `seo.ts` deliberately: that module is also pulled in by
 * `json-ld.ts` and the sitemap, and it should stay free of `next-intl/server`
 * so it can be imported from anywhere.
 *
 * Usage, in a page file:
 *   export const generateMetadata = pageMetadata("/about", "about");
 *
 * The key resolves `meta.<key>Title` and `meta.<key>Description`.
 */
export function pageMetadata(
  path: string,
  key: string,
  options: { noIndex?: boolean } = {}
) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "meta" });

    return buildMetadata({
      locale,
      path,
      title: t(`${key}Title`),
      description: t(`${key}Description`),
      noIndex: options.noIndex,
    });
  };
}
