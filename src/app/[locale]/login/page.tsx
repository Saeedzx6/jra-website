import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/login-form";

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
      <h1 className="text-center font-display text-2xl font-semibold text-ink">
        {tl("welcomeBack")}
      </h1>
      <p className="mt-2 text-center text-sm text-ink-soft">{tl("intro")}</p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
