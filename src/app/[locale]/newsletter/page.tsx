import { getTranslations, setRequestLocale } from "next-intl/server";
import { NewsletterForm } from "@/components/newsletter-form";
import { pageMetadata } from "@/lib/page-metadata";

// Cached and revalidated every 3600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 3600;

export const generateMetadata = pageMetadata("/newsletter", "newsletter");

export default async function NewsletterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <h1 className="font-display text-5xl text-ink">{tNav("newsletter")}</h1>
      <p className="mt-3 text-ink-soft">{t("newsletterSubtitle")}</p>
      <div className="mt-8 rounded-2xl border border-rule bg-ink p-8 text-paper">
        <NewsletterForm />
      </div>
    </div>
  );
}
