import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const tm = await getTranslations("marketplace");
  const tCategory = await getTranslations("marketplace.categoryLabels");
  const listing = await db.marketplaceListing.findUnique({ where: { id } });
  if (!listing || listing.status !== "PUBLISHED") notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <span className="inline-block rounded-full bg-brass-soft px-2.5 py-0.5 text-xs font-medium text-brass">
        {tCategory(listing.category)}
      </span>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">{listing.title}</h1>
      {listing.price ? (
        <p className="tabular mt-1 text-lg font-semibold text-accent">
          {listing.price} {listing.priceCurrency}
        </p>
      ) : (
        <p className="mt-1 text-ink-faint">{tm("priceOnRequest")}</p>
      )}
      <div
        className="prose mt-6 max-w-none leading-relaxed text-ink-soft"
        dangerouslySetInnerHTML={{ __html: listing.descriptionHtml }}
      />
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
