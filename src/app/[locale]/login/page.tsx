import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/layout/PageHero";
import { LoginForm } from "@/components/forms/LoginForm";

/**
 * Member sign-in.
 *
 * The ported design shipped as a prototype: a disabled button and an on-page
 * notice warning that nothing was behind it. It is now wired to the platform's
 * credential provider (see components/forms/LoginForm), so the form is real
 * and the notice has been removed.
 */
export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

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
          <LoginForm />
        </div>
      </section>
    </>
  );
}
