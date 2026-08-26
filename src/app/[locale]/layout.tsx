import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { SITE_URL, alternatesFor } from "@/lib/seo";
import { jsonLdScript, organizationLd } from "@/lib/json-ld";
import "../globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    // Required for OG images and canonicals to resolve to absolute URLs.
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("siteTitle"),
      template: `%s — ${t("siteTitle")}`,
    },
    description: t("siteDescription"),
    alternates: alternatesFor(locale, "/"),
    openGraph: {
      title: t("siteTitle"),
      description: t("siteDescription"),
      siteName: t("siteTitle"),
      locale: locale === "ar" ? "ar_JO" : "en_US",
      type: "website",
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// NOTE: `dynamic = "force-dynamic"` used to live here, which opted the entire
// site — including pages that never change — out of caching, costing a cold
// render plus a database round-trip on every request.
//
// It is now set per route instead. Pages that read live data declare their own
// `revalidate`, and anything reading cookies or headers (admin, portal, login)
// is opted out of static rendering by Next automatically. See
// docs/PLATFORM-BLUEPRINT.md §4.2 for the per-surface strategy.

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
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={fontVariables} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationLd(locale)) }}
        />
        <NextIntlClientProvider messages={messages}>
          {/* Keyboard users land here first and can jump the 8-item nav.
              Visually hidden until focused (WCAG 2.4.1). */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            {tCommon("skipToContent")}
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          {/* One observer for the whole site, so any element carrying
              `reveal` animates in without its page needing a wrapper. */}
          <RevealOnScroll />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
