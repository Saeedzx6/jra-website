import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { MarketplaceModerationRow } from "@/components/admin/marketplace-row";

export default async function AdminMarketplacePage() {
  const tm = await getTranslations("marketplace");
  const pending = await db.marketplaceListing.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tm("moderationTitle")}</h1>
      <div className="mt-6 space-y-3">
        {pending.map((l) => (
          <MarketplaceModerationRow
            key={l.id}
            id={l.id}
            title={l.title}
            category={l.category}
            price={l.price}
          />
        ))}
        {pending.length === 0 && <p className="text-ink-soft">{tm("noPendingListings")}</p>}
      </div>
    </div>
  );
}
