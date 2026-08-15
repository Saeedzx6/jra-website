import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Poppins, DM_Sans, Cairo } from "next/font/google";

import { routing, direction, type Locale } from "@/i18n/routing";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import "@/styles/index.css";

/**
 * Latin display face. Direction B's signature is italic 700 Poppins, so the
 * italic axis is loaded deliberately rather than left to synthesis.
 */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display-latin",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans-latin",
  display: "swap",
});

/**
 * Arabic face, used for both display and body in the ar locale.
 *
 * Italic is not a legitimate emphasis form in Arabic typography — a slanted
 * Arabic word reads as a rendering fault, not as emphasis. So the Arabic build
 * does NOT inherit Direction B's italic display; it carries the same visual
 * weight through Cairo 700 with tightened tracking instead. See
 * design-system/MASTER.md, "Bilingual type".
 */
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "brand" });

  return {
    title: {
      default: t("name"),
      template: `%s · ${t("short")}`,
    },
    description: t("tagline"),
    icons: { icon: "/favicon.ico" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Opts this subtree into static rendering.
  setRequestLocale(locale);

  const dir = direction[locale as Locale];
  const fontVars = `${poppins.variable} ${dmSans.variable} ${cairo.variable}`;

  return (
    <html lang={locale} dir={dir} className={fontVars} data-locale={locale}>
      <body>
        <NextIntlClientProvider>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
