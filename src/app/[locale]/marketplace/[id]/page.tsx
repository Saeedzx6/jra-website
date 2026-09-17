import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { buildMetadata, toDescription } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { cx, ui } from "@/lib/ui";

// Cached and revalidated every 600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  const listing = await db.marketplaceListing.findUnique({
    where: { id },
    select: { title: true, descriptionHtml: true, status: true, images: { select: { url: true }, take: 1 } },
  });

  // Unpublished listings must never be indexed — they are pending review or
  // expired, and the page itself 404s.
  if (!listing || listing.status !== "PUBLISHED") {
    return buildMetadata({
      locale,
      path: `/marketplace/${id}`,
      title: t("marketplaceTitle"),
      description: t("marketplaceDescription"),
      noIndex: true,
    });
  }

  return buildMetadata({
    locale,
    path: `/marketplace/${id}`,
    title: listing.title,
    description: toDescription(listing.descriptionHtml) ?? t("marketplaceDescription"),
    image: listing.images[0]?.url ?? null,
  });
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const tm = await getTranslations("marketplace");
  const tCategory = await getTranslations("marketplace.categoryLabels");
  const tn = await getTranslations("nav");
  const listing = await db.marketplaceListing.findUnique({ where: { id } });
  if (!listing || listing.status !== "PUBLISHED") notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        locale={locale}
        trail={[
          { name: tn("home"), path: "/" },
          { name: tn("marketplace"), path: "/marketplace" },
          { name: listing.title, path: `/marketplace/${id}` },
        ]}
      />
      <span className="inline-block rounded-full bg-brass-soft px-2.5 py-0.5 text-xs font-medium text-brass-text">
        {tCategory(listing.category)}
      </span>
      <h1 className={cx("mt-3", ui.pageTitle)}>{listing.title}</h1>
      {listing.price ? (
        <p className="tabular mt-1 text-lg font-semibold text-accent">
          {listing.price} {listing.priceCurrency}
        </p>
      ) : (
        <p className="mt-1 text-ink-faint">{tm("priceOnRequest")}</p>
      )}
      {/*
        Rendered as text, not HTML.

        `createMarketplaceListing` checks only that someone is signed in -- not
        their role -- and validates this field with `z.string().min(10)`, so any
        member could store `<img src=x onerror=...>` here. It was then printed
        with `dangerouslySetInnerHTML` on this page the moment an admin
        published the listing, and the admin review screen shows the title and
        status without ever rendering the body, so nobody saw the payload on
        the way through.

        Nothing is lost by treating it as text: the form behind it is a plain
        <textarea>, not a rich-text editor, so what people type is prose.
        `whitespace-pre-line` keeps the paragraph breaks they typed.

        The column keeps its `descriptionHtml` name. Renaming it is a migration,
        and migrations here reach the production database as soon as a pull
        request opens a preview deploy -- which would break the currently
        deployed site, since it still selects the old name.
      */}
      <div className="mt-6 max-w-none whitespace-pre-line leading-relaxed text-ink-soft">
        {listing.descriptionHtml}
      </div>
      <div className="mt-8 space-y-2 rounded-xl border border-rule bg-surface p-5">
        {listing.contactPhone ? (
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <Phone className="h-4 w-4 text-accent" />
            <span dir="ltr">{listing.contactPhone}</span>
          </div>
        ) : null}
        {listing.contactEmail ? (
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <Mail className="h-4 w-4 text-accent" />
            <span>{listing.contactEmail}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
