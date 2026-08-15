import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/layout/PageHero";

/**
 * Member sign-in form.
 *
 * This is a front-end prototype with no authentication behind it. The notice
 * saying so is rendered on the page itself, not just left in a comment — a
 * form that looks exactly like a real login will otherwise collect real
 * passwords from members who cannot tell the difference.
 */
export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("login");
  const tMod = await getTranslations("modules");

  return (
    <>
      <PageHero
        title={tMod("loginTitle")}
        lede={tMod("loginLede")}
        crumbs={[{ label: "JRA", href: "/" }, { label: tMod("loginTitle") }]}
      />

      <section className="section">
        <div className="wrap">
          <div
            style={{
              maxInlineSize: "26rem",
              display: "grid",
              gap: "1.25rem",
              padding: "2rem",
              background: "#fff",
              borderRadius: "var(--r-lg)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <p
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "var(--r-md)",
                borderInlineStart: "4px solid var(--status-alert)",
                background: "var(--grey-50)",
                fontSize: "0.875rem",
                color: "var(--ink-soft)",
              }}
            >
              {t("demoNotice")}
            </p>

            <div className="field">
              <label htmlFor="username">{t("username")}</label>
              <input id="username" name="username" type="text" autoComplete="username" />
            </div>

            <div className="field">
              <label htmlFor="password">{t("password")}</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
              />
            </div>

            <button type="button" className="btn" disabled aria-disabled="true">
              {t("submit")}
            </button>

            <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)" }}>
              {t("noAccount")}{" "}
              <Link href="/membership" style={{ color: "var(--accent)", fontWeight: 700 }}>
                {t("join")}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
