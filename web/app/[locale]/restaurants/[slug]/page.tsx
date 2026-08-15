import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { EntryDetail } from "@/components/directory/EntryDetail";
import { getRestaurant, restaurants } from "@/lib/directory";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    restaurants.map((r) => ({ locale, slug: r.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getRestaurant(slug);
  if (!entry) return {};
  return {
    title: entry.name,
    description: entry.blurb || `${entry.cuisine} · ${entry.city}`,
  };
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const entry = getRestaurant(slug);
  if (!entry) notFound();

  return <EntryDetail entry={entry} kind="restaurants" />;
}
