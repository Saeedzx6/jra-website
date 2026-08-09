import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/rbac";
import { SustainabilityCalculator } from "@/components/sustainability/calculator";

export default async function PortalSustainabilityPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const ts = await getTranslations("sustainability");
  const tCommon = await getTranslations("common");
  const managed = await db.businessManager.findMany({
    where: { userId: session.user.id, restaurantId: { not: null } },
    include: { restaurant: true },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{ts("portalTitle")}</h1>
      <p className="mt-2 max-w-xl text-ink-soft">{ts("portalIntro")}</p>

      <div className="mt-8 space-y-8">
        {managed.map((m) => {
          const restaurant = m.restaurant!;
          return (
            <div key={m.id}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">{restaurant.name}</h2>
                {restaurant.sustainabilityScore ? (
                  <span className="tabular rounded-full bg-olive-soft px-3 py-1 text-sm font-medium text-olive">
                    {ts("currentScore", { score: Math.round(restaurant.sustainabilityScore) })}
                  </span>
                ) : null}
              </div>
              <div className="mt-3">
                <SustainabilityCalculator restaurantId={restaurant.id} />
              </div>
            </div>
          );
        })}
        {managed.length === 0 && (
          <p className="text-ink-soft">{tCommon("noRestaurantsLinked")}</p>
        )}
      </div>
    </div>
  );
}
