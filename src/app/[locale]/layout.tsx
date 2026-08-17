import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { routing, direction, type Locale } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { SiteFooter } from "@/components/chrome/SiteFooter";
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
    icons: { icon: "/favicon.ico" },
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
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Opts this subtree into static rendering.
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = direction[locale as Locale];

  // The skip link, header and footer are the ported chrome. SiteHeader renders
  // its own skip link (styled by .skip-link in the Direction B layer), so one
  // is NOT emitted here — two "skip to content" targets is a worse experience
  // for the screen-reader users the link exists for.
  return (
    <html lang={locale} dir={dir} className={fontVariables} data-locale={locale} suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationLd(locale)) }}
        />
        <NextIntlClientProvider messages={messages}>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
