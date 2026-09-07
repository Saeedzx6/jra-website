import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin, Phone, Mail, Globe, Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { buildMetadata, toDescription } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";

// Associate members are edited from the back office, so this is cached and
// revalidated hourly rather than rendered per visit.
export const revalidate = 3600;

/** Cached: `generateMetadata` and the page body both need the same record. */
const supplierBySlug = cache(async (slug: string) =>
  db.supplier.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      governorate: true,
      categories: { include: { category: true } },
    },
  })
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const supplier = await supplierBySlug(slug);

  if (!supplier || supplier.status !== "PUBLISHED") {
    return buildMetadata({
      locale,
      path: `/suppliers/${slug}`,
      title: t("suppliersTitle"),
      description: t("suppliersDescription"),
      noIndex: true,
    });
  }

  const ar = locale === "ar";
  const name = ar && supplier.nameAr ? supplier.nameAr : supplier.name;

  return buildMetadata({
    locale,
    path: `/suppliers/${slug}`,
    title: name,
    description:
      supplier.shortDescription ??
      toDescription(supplier.fullDescriptionHtml) ??
      t("suppliersDescription"),
    image: supplier.images.find((i) => i.isPrimary)?.url ?? supplier.images[0]?.url ?? null,
  });
}

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const supplier = await supplierBySlug(slug);
  if (!supplier || supplier.status !== "PUBLISHED") notFound();

  const tn = await getTranslations("nav");
  const ts = await getTranslations("suppliers");
  const ar = locale === "ar";

  const name = ar && supplier.nameAr ? supplier.nameAr : supplier.name;
  const cover = supplier.images.find((i) => i.isPrimary) ?? supplier.images[0];
  const rest = supplier.images.filter((i) => i.id !== cover?.id);

  /** Reads the image's own alt text, falling back to a numbered description. */
  const imageAlt = (
    img: { altTextEn: string | null; altTextAr: string | null },
    index: number
  ) => {
    const stored = ar ? img.altTextAr : img.altTextEn;
    if (stored) return stored;
    return index === 0 ? name : ts("photoAlt", { number: index + 1, name });
  };

  const contact = [
    supplier.addressText && { Icon: MapPin, value: supplier.addressText, href: null },
    supplier.phone && { Icon: Phone, value: supplier.phone, href: `tel:${supplier.phone}` },
    supplier.email && { Icon: Mail, value: supplier.email, href: `mailto:${supplier.email}` },
    supplier.website && { Icon: Globe, value: supplier.website, href: supplier.website },
  ].filter(Boolean) as { Icon: typeof MapPin; value: string; href: string | null }[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        locale={locale}
        trail={[
          { name: tn("home"), path: "/" },
          { name: tn("suppliers"), path: "/suppliers" },
          { name, path: `/suppliers/${slug}` },
        ]}
      />

      <header className="mt-2">
        <h1 className="font-display text-5xl font-semibold text-ink">{name}</h1>
        {supplier.governorate ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-soft">
            <Building2 className="h-4 w-4 text-accent" aria-hidden="true" />
            {(ar && supplier.governorate.nameAr) || supplier.governorate.nameEn}
          </p>
        ) : null}
      </header>

      {cover ? (
        <div className="zoom-frame relative mt-8 aspect-[21/9] overflow-hidden rounded-2xl border border-rule bg-surface-2">
          <Image
            src={cover.url}
            alt={imageAlt(cover, 0)}
            fill
            priority
            sizes="(min-width: 1432px) 1432px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {supplier.shortDescription ? (
            <p className="text-lg leading-relaxed text-ink-soft">{supplier.shortDescription}</p>
          ) : null}

          {supplier.fullDescriptionHtml ? (
            <div
              className="prose mt-6 max-w-none leading-relaxed text-ink-soft [&_a]:text-accent"
              dangerouslySetInnerHTML={{ __html: supplier.fullDescriptionHtml }}
            />
          ) : null}

          {supplier.categories.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold text-ink">{ts("categories")}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {supplier.categories.map((c) => (
                  <span
                    key={c.category.id}
                    className="rounded-full border border-rule px-4 py-1.5 text-sm text-ink-soft"
                  >
                    {(ar && c.category.nameAr) || c.category.nameEn}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {rest.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold text-ink">{ts("gallery")}</h2>
              <div className="stagger mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {rest.map((img, i) => (
                  <div
                    key={img.id}
                    className="zoom-frame relative aspect-square overflow-hidden rounded-xl border border-rule bg-surface-2"
                  >
                    <Image
                      src={img.url}
                      alt={imageAlt(img, i + 1)}
                      fill
                      sizes="(min-width: 640px) 240px, 45vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="h-fit rounded-2xl border border-rule bg-surface p-6 sm:p-10">
          <h2 className="ui-caps font-semibold text-ink-faint">{ts("contact")}</h2>
          {contact.length > 0 ? (
            <ul className="mt-4 space-y-3 text-sm">
              {contact.map(({ Icon, value, href }) => (
                <li key={value} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  {href ? (
                    <a
                      href={href}
                      {...(href.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      dir={href.startsWith("tel:") ? "ltr" : undefined}
                      className="break-words text-ink-soft transition-colors hover:text-accent"
                    >
                      {value}
                    </a>
                  ) : (
                    <span className="leading-relaxed text-ink-soft">{value}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-faint">{ts("noContactYet")}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
