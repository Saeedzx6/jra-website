import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { ContactForm } from "@/components/forms/ContactForm";
import { brand, pick } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const activeLocale = (await getLocale()) as Locale;
  const t = await getTranslations("contact");
  const tMod = await getTranslations("modules");

  return (
    <>
      <PageHero
        title={tMod("contactTitle")}
        lede={tMod("contactLede")}
        crumbs={[{ label: "JRA", href: "/" }, { label: tMod("contactTitle") }]}
      />

      <section className="section">
        <div className="wrap">
          <div className="grid cols-2" style={{ alignItems: "start" }}>
            <ContactForm />

            <aside
              style={{
                display: "grid",
                gap: "0.5rem",
                padding: "1.75rem",
                background: "#fff",
                borderRadius: "var(--r-lg)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <h2 className="eyebrow" style={{ color: "var(--ink-soft)" }}>
                {t("reachUs")}
              </h2>
              <address style={{ display: "grid", gap: "0.5rem", fontStyle: "normal" }}>
                <span>{pick(brand.address, activeLocale)}</span>
                <a href={`tel:${brand.phone.replace(/\s/g, "")}`} dir="ltr">
                  {brand.phone}
                </a>
                <a href={`mailto:${brand.email}`} dir="ltr">
                  {brand.email}
                </a>
              </address>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
