import { getTranslations, setRequestLocale } from "next-intl/server";
import { Phone, Mail, MapPin } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

// Cached and revalidated every 3600s. Set per route since the site-wide
// force-dynamic was removed from the locale layout (blueprint §4.2).
export const revalidate = 3600;

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tf = await getTranslations("footer");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">{t("contact")}</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ContactForm />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <div className="reveal flex items-start gap-3 rounded-xl border border-rule bg-surface p-4">
            <Phone className="mt-0.5 h-5 w-5 text-accent" />
            <div>
              <div className="text-xs uppercase tracking-wide text-ink-faint">
                {tf("phone")}
              </div>
              <div dir="ltr" className="text-sm font-medium text-ink">
                +962 6 462 1558
              </div>
            </div>
          </div>
          <div className="reveal flex items-start gap-3 rounded-xl border border-rule bg-surface p-4">
            <Mail className="mt-0.5 h-5 w-5 text-accent" />
            <div>
              <div className="text-xs uppercase tracking-wide text-ink-faint">
                {tf("email")}
              </div>
              <div className="text-sm font-medium text-ink">info@jra.jo</div>
            </div>
          </div>
          <div className="reveal flex items-start gap-3 rounded-xl border border-rule bg-surface p-4">
            <MapPin className="mt-0.5 h-5 w-5 text-accent" />
            <div>
              <div className="text-xs uppercase tracking-wide text-ink-faint">
                {tf("address")}
              </div>
              <div className="text-sm font-medium text-ink">{tf("addressLine")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
