import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { EntryDetail } from "@/components/directory/EntryDetail";
import { getSupplier, suppliers } from "@/lib/directory";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    suppliers.map((s) => ({ locale, slug: s.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getSupplier(slug);
  if (!entry) return {};
  return {
    title: entry.name,
    description: entry.blurb || `${entry.trade} · ${entry.city}`,
  };
}

export default async function SupplierPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const entry = getSupplier(slug);
  if (!entry) notFound();

  return <EntryDetail entry={entry} kind="suppliers" />;
}
