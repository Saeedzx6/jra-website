import { getTranslations, setRequestLocale } from "next-intl/server";
import { RestaurantCard } from "@/components/restaurant-card";
import { RevealGroup } from "@/components/reveal";
import { DirectoryFilters } from "@/components/directory-filters";
import { Pagination } from "@/components/pagination";
import { searchRestaurants, getDirectoryFacets } from "@/lib/restaurants";

// Search/pagination is entirely driven by the URL query string; force this
// route to always render fresh server-side rather than risk the client
// router cache serving a previous page's results until a hard refresh.
export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  governorate?: string;
  cuisine?: string;
  feature?: string;
  stars?: string;
  page?: string;
};

export default async function RestaurantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const [t, tCommon, tr, facets, results] = await Promise.all([
    getTranslations("nav"),
    getTranslations("common"),
    getTranslations("restaurants"),
    getDirectoryFacets(),
    searchRestaurants({
      q: sp.q,
      governorate: sp.governorate,
      cuisine: sp.cuisine,
      feature: sp.feature,
      stars: sp.stars ? Number(sp.stars) : undefined,
      page: sp.page ? Number(sp.page) : 1,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">{t("restaurants")}</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">{tr("description")}</p>

      <DirectoryFilters
        governorates={facets.governorates}
        cuisines={facets.cuisines}
        current={sp}
      />

      <div className="mt-6 text-sm text-ink-faint">
        {results.total} {results.total === 1 ? tCommon("result") : tCommon("results")}
      </div>

      {results.items.length === 0 ? (
        <p className="mt-16 text-center text-ink-soft">{tCommon("noResults")}</p>
      ) : (
        <RevealGroup
          resetKey={`${results.page}|${sp.q ?? ""}|${sp.governorate ?? ""}|${sp.cuisine ?? ""}`}
          className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {results.items.map((r) => (
            <div key={r.slug} className="reveal">
              <RestaurantCard restaurant={r} />
            </div>
          ))}
        </RevealGroup>
      )}

      <Pagination
        basePath="/restaurants"
        current={results.page}
        total={results.totalPages}
        params={{ q: sp.q, governorate: sp.governorate, cuisine: sp.cuisine, stars: sp.stars }}
      />
    </div>
  );
}
