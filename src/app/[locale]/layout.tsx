import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "Jordan Restaurant Association",
    template: "%s — Jordan Restaurant Association",
  },
  description:
    "The official platform of the Jordan Restaurant Association (JRA) — restaurant directory, classification, membership, and sector resources.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// The whole site reads live data (restaurant counts, admin queues, directory
// listings, ...) straight from Postgres on every page. Without this, Next.js
// prerenders many of these routes as static HTML at build time — the numbers
// then freeze at whatever they were during `next build` and never change
// again until the next deploy, no matter what happens in the database.
export const dynamic = "force-dynamic";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={fontVariables} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased">
        <NextIntlClientProvider messages={messages}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
