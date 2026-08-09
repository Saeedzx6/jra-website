import { ClipboardCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/rbac";
import { startAssessmentAndRedirect } from "@/lib/actions/classification";

export default async function PortalClassificationPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const tc = await getTranslations("classification");
  const tCommon = await getTranslations("common");
  const managed = await db.businessManager.findMany({
    where: { userId: session.user.id, restaurantId: { not: null } },
    include: { restaurant: { include: { assessments: { orderBy: { createdAt: "desc" }, take: 1 } } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tc("portalTitle")}</h1>
      <p className="mt-2 max-w-xl text-ink-soft">{tc("portalIntro")}</p>

      <div className="mt-8 space-y-3">
        {managed.map((m) => {
          const restaurant = m.restaurant!;
          const latest = restaurant.assessments[0];
          return (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-2xl border border-rule bg-surface p-5"
            >
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">
                  {restaurant.name}
                </h2>
                {latest ? (
                  <p className="mt-1 text-sm text-ink-soft">
                    {tc("lastAssessment", {
                      status: tc(`statusLabels.${latest.status.toLowerCase()}`),
                    })}
                    {latest.resultingStars
                      ? ` — ${latest.resultingStars} ${
                          latest.resultingStars === 1 ? tCommon("star") : tCommon("stars")
                        }`
                      : ""}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-ink-faint">{tc("noAssessmentYet")}</p>
                )}
              </div>
              <form action={startAssessmentAndRedirect.bind(null, restaurant.id)}>
                <button suppressHydrationWarning className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
                  <ClipboardCheck className="h-4 w-4" />
                  {latest?.status === "IN_PROGRESS" ? tc("resume") : tc("startNew")}
                </button>
              </form>
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
