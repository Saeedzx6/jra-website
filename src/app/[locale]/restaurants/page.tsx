import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHero } from "@/components/layout/PageHero";
import { DirectoryBrowser } from "@/components/directory/DirectoryBrowser";
import { restaurants, vocab } from "@/lib/directory";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("restaurants") };
}

export default async function RestaurantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Read on the server so the browser is handed an already-filtered list and
  // the client component needs no Suspense boundary. See DirectoryBrowser.
  const sp = await searchParams;
  const one = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : (value ?? "");
  };

  const t = await getTranslations("nav");
  const tHome = await getTranslations("home");

  return (
    <>
      <PageHero
        eyebrow={tHome("directoryEyebrow")}
        title={t("restaurants")}
        lede={tHome("heroLede", { count: vocab.totals.restaurants })}
        crumbs={[{ label: "JRA", href: "/" }, { label: t("restaurants") }]}
      />

      <section className="section">
        <div className="wrap">
          <DirectoryBrowser
            entries={restaurants}
            kind="restaurants"
            initialFilters={{
              q: one("q"),
              category: one("category"),
              city: one("city"),
              feature: one("feature"),
            }}
          />
        </div>
      </section>
    </>
  );
}
