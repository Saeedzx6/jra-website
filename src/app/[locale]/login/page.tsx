import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/login-form";
import { pageMetadata } from "@/lib/page-metadata";

export const generateMetadata = pageMetadata("/login", "login", { noIndex: true });

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tl = await getTranslations("login");

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <h1 className="text-center font-display font-semibold text-5xl text-ink">
        {tl("welcomeBack")}
      </h1>
      <p className="mt-2 text-center text-sm text-ink-soft">{tl("intro")}</p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
