import { getTranslations, setRequestLocale } from "next-intl/server";
import { ExternalLink } from "lucide-react";

export default async function JobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("jobs");

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">{t("title")}</h1>
      <p className="mt-4 leading-relaxed text-ink-soft">{t("description")}</p>
      <a
        href="#"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
      >
        {t("cta")}
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
