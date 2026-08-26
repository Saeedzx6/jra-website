import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClipboardCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MembershipForm } from "@/components/membership-form";

// Cached and revalidated every 3600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 3600;

export default async function MembershipPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tf = await getTranslations("footer");
  const tm = await getTranslations("membership");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-eyebrow font-semibold text-accent">
        {t("membership")}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
        {tf("tagline")}
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">{tm("intro")}</p>
      <Link
        href="/classification/restaurant"
        className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-accent bg-accent-soft p-5 transition-transform hover:-translate-y-0.5"
      >
        <ClipboardCheck className="h-6 w-6 shrink-0 text-accent" />
        <span className="text-sm text-ink">
          <strong className="text-ink">{tm("classificationPromptBold")}</strong>{" "}
          {tm("classificationPromptText")}
        </span>
      </Link>

      <div className="mt-6 rounded-2xl border border-rule bg-surface p-6 sm:p-8">
        <MembershipForm />
      </div>
    </div>
  );
}
