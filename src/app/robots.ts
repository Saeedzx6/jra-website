import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Crawler rules.
 *
 * The disallow list matters more than usual here: /api/documents serves
 * applicants' trade licences and ownership papers behind a session check, and
 * /portal and /admin are member and staff areas. None of it should ever appear
 * in an index — the session gate is the real protection, this is defence in
 * depth against a crawler following a leaked link.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/en/admin",
          "/ar/admin",
          "/en/portal",
          "/ar/portal",
          "/en/login",
          "/ar/login",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
