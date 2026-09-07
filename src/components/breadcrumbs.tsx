import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { jsonLdScript, breadcrumbLd } from "@/lib/json-ld";

export type Crumb = {
  name: string;
  /** Locale-less path. The last crumb's path is used for the JSON-LD only. */
  path: string;
};

/**
 * Breadcrumb trail for detail pages.
 *
 * The visible trail and the BreadcrumbList structured data are emitted from
 * the same array on purpose. Previously only the restaurant page had the
 * markup and nothing on screen showed a trail, so search results advertised a
 * hierarchy the page itself never displayed — which is exactly the mismatch
 * Google's structured-data guidelines warn about.
 *
 * The final crumb is the current page: rendered as plain text with
 * `aria-current`, not as a link, because linking a page to itself is noise for
 * anyone navigating by keyboard or screen reader.
 *
 * Separators are decorative and flipped under RTL, where the trail reads
 * right-to-left and a right-pointing chevron would point back the way it came.
 */
export function Breadcrumbs({ locale, trail }: { locale: string; trail: Crumb[] }) {
  if (trail.length < 2) return null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbLd(locale, trail)) }}
      />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ink-faint">
          {trail.map((crumb, i) => {
            const isLast = i === trail.length - 1;
            return (
              <li key={crumb.path} className="flex items-center gap-x-1.5">
                {i > 0 ? (
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 text-ink-faint/60 rtl:rotate-180"
                    aria-hidden="true"
                  />
                ) : null}
                {isLast ? (
                  <span aria-current="page" className="font-medium text-ink-soft">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.path}
                    className="rounded transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
