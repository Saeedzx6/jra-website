import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/rbac";
import { ListingForm } from "@/components/marketplace/listing-form";

export default async function PortalMarketplacePage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const tm = await getTranslations("marketplace");
  const listings = await db.marketplaceListing.findMany({
    where: { postedById: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tm("myListings")}</h1>

      <div className="mt-6 rounded-2xl border border-rule bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink">{tm("postNewListing")}</h2>
        <div className="mt-4">
          <ListingForm />
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {listings.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-xl border border-rule bg-surface p-4">
            <span className="text-sm font-medium text-ink">{l.title}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                l.status === "PUBLISHED"
                  ? "bg-olive-soft text-olive-text"
                  : l.status === "PENDING"
                    ? "bg-brass-soft text-brass-text"
                    : "bg-surface-2 text-ink-faint"
              }`}
            >
              {tm(`statusLabels.${l.status.toLowerCase()}`)}
            </span>
          </div>
        ))}
        {listings.length === 0 && <p className="text-ink-soft">{tm("noListingsYet")}</p>}
      </div>
    </div>
  );
}
