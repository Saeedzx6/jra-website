import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { MarketplaceModerationRow } from "@/components/admin/marketplace-row";
import { ui } from "@/lib/ui";

export default async function AdminMarketplacePage() {
  const tm = await getTranslations("marketplace");
  const pending = await db.marketplaceListing.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className={ui.sectionTitle}>{tm("moderationTitle")}</h1>
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
