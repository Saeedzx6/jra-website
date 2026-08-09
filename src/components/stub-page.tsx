import { Construction } from "lucide-react";
import { useTranslations } from "next-intl";

export function StubPage({ title, description }: { title: string; description: string }) {
  const t = useTranslations("common");
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brass-soft">
        <Construction className="h-6 w-6 text-brass" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">{title}</h1>
      <p className="mt-3 leading-relaxed text-ink-soft">{description}</p>
      <p className="mt-6 text-sm text-ink-faint">{t("comingSoon")}</p>
    </div>
  );
}
