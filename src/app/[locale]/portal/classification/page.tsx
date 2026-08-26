import { ClipboardCheck, Clock, Star } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/rbac";
import { startAssessmentAndRedirect } from "@/lib/actions/classification";
import { nextAction } from "@/lib/classification-lifecycle";
import { ReRatingRequestForm } from "@/components/portal/re-rating-request-form";

/**
 * An establishment rates itself once, when it joins. After JRA has ruled on
 * that rating the button is no longer "start" — a grade is an award, and
 * re-running the checklist is something the association opens, not something
 * the establishment helps itself to. So each card shows where its one rating
 * has got to and offers the single action that makes sense there.
 */
export default async function PortalClassificationPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const tc = await getTranslations("classification");
  const tCommon = await getTranslations("common");

  const managed = await db.businessManager.findMany({
    where: { userId: session.user.id, restaurantId: { not: null } },
    include: {
      restaurant: {
        include: { assessments: { orderBy: { cycle: "desc" }, take: 1 } },
      },
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tc("portalTitle")}</h1>
      <p className="mt-2 max-w-xl text-ink-soft">{tc("portalIntro")}</p>

      <div className="mt-8 space-y-3">
        {managed.map((m) => {
          const restaurant = m.restaurant!;
          const latest = restaurant.assessments[0] ?? null;
          const status = latest?.status ?? null;

          // The one action that makes sense for where this rating has got to,
          // decided by the same function the server actions enforce — so the
          // button on screen and the rule behind it cannot drift apart.
          const action = nextAction(latest);
          const canResume = action === "resume";
          const canStart = action === "start";
          const canRequest = action === "request";
          const waiting = action === "waiting";

          return (
            <div key={m.id} className="rounded-2xl border border-rule bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold text-ink">{restaurant.name}</h2>

                  {status === null ? (
                    <p className="mt-1 text-sm text-ink-faint">{tc("noAssessmentYet")}</p>
                  ) : (
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                      <span>
                        {tc("lastAssessment", {
                          status: tc(`statusLabels.${status.toLowerCase()}`),
                        })}
                      </span>
                      {latest?.resultingStars ? (
                        <span className="inline-flex items-center gap-1 text-brass-text">
                          <Star className="h-3.5 w-3.5 fill-brass" aria-hidden="true" />
                          {latest.resultingStars}{" "}
                          {latest.resultingStars === 1 ? tCommon("star") : tCommon("stars")}
                        </span>
                      ) : null}
                      {latest && latest.cycle > 1 ? (
                        <span className="text-xs text-ink-faint">
                          {tc("cycleLabel", { cycle: latest.cycle })}
                        </span>
                      ) : null}
                    </p>
                  )}

                  {status === "REJECTED" && latest?.reviewNote ? (
                    <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-soft">
                      {latest.reviewNote}
                    </p>
                  ) : null}
                </div>

                <div className="shrink-0">
                  {canStart || canResume ? (
                    <form action={startAssessmentAndRedirect.bind(null, restaurant.id)}>
                      <button
                        suppressHydrationWarning
                        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                      >
                        <ClipboardCheck className="h-4 w-4" />
                        {canResume ? tc("resume") : tc("startRating")}
                      </button>
                    </form>
                  ) : waiting && latest ? (
                    <Link
                      href={`/portal/classification/${latest.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-rule px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent"
                    >
                      <Clock className="h-4 w-4" />
                      {status === "REQUESTED" ? tc("awaitingOpen") : tc("awaitingReview")}
                    </Link>
                  ) : null}
                </div>
              </div>

              {canRequest ? <ReRatingRequestForm restaurantId={restaurant.id} /> : null}
            </div>
          );
        })}

        {managed.length === 0 && <p className="text-ink-soft">{tCommon("noRestaurantsLinked")}</p>}
      </div>
    </div>
  );
}
