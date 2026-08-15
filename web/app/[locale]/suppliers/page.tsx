import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { PageHero } from "@/components/layout/PageHero";
import { DirectoryBrowser } from "@/components/directory/DirectoryBrowser";
import { suppliers } from "@/lib/directory";
import { destinations, pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("suppliers") };
}

export default async function SuppliersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const one = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : (value ?? "");
  };

  const t = await getTranslations("nav");
  const activeLocale = (await getLocale()) as Locale;
  const destination = destinations.find((d) => d.key === "suppliers")!;

  return (
    <>
      <PageHero
        eyebrow={pick(destination.eyebrow, activeLocale)}
        title={t("suppliers")}
        lede={pick(destination.body, activeLocale)}
        crumbs={[{ label: "JRA", href: "/" }, { label: t("suppliers") }]}
      />

      <section className="section">
        <div className="wrap">
          <DirectoryBrowser
            entries={suppliers}
            kind="suppliers"
            initialFilters={{
              q: one("q"),
              category: one("category"),
              city: one("city"),
            }}
          />
        </div>
      </section>
    </>
  );
}
