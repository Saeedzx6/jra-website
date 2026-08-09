import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/rbac";
import { logoutAction } from "@/lib/actions/auth";
import { ClipboardCheck, Store, LogOut } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SuggestEditForm } from "@/components/portal/suggest-edit-form";

export default async function PortalDashboard() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const tp = await getTranslations("portal");
  const managed = await db.businessManager.findMany({
    where: { userId: session.user.id },
    include: { restaurant: true, supplier: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {tp("welcome", { name: session?.user.name ?? "" })}
        </h1>
        <form action={logoutAction}>
          <button suppressHydrationWarning className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent">
            <LogOut className="h-4 w-4" /> {tp("logOut")}
          </button>
        </form>
      </div>

      {managed.length === 0 ? (
        <p className="mt-8 text-ink-soft">{tp("noBusinessLinked")}</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {managed.map((m) => {
            const biz = m.restaurant ?? m.supplier;
            if (!biz) return null;
            return (
              <div key={m.id} className="rounded-2xl border border-rule bg-surface p-5">
                <div className="flex items-center gap-2 text-ink-faint">
                  <Store className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">
                    {m.restaurant ? tp("restaurant") : tp("supplier")}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-lg font-semibold text-ink">{biz.name}</h2>
                {m.restaurant ? (
                  <>
                    <Link
                      href="/portal/classification"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      {tp("startClassification")}
                    </Link>
                    <div className="mt-4 border-t border-rule pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                        {tp("suggestProfileUpdate")}
                      </p>
                      <SuggestEditForm
                        restaurantId={m.restaurant.id}
                        userId={session.user.id}
                        currentShortDescription={m.restaurant.shortDescription ?? ""}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
