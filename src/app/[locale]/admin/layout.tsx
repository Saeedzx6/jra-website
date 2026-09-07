import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/rbac";
import { getMessages } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Store,
  Building2,
  Newspaper,
  Mail,
  Users,
  Users2,
  ListChecks,
  Tag,
  Leaf,
  Scale,
  GraduationCap,
  BookOpen,
  Send,
  Library,
  ClipboardCheck,
  Image as ImageIcon,
} from "lucide-react";

/**
 * Signed-in areas must never be indexed. robots.txt already disallows these
 * paths, but robots.txt is a crawl instruction, not an index instruction — a
 * URL linked from elsewhere can still be listed without being fetched. The
 * meta tag is what actually keeps it out.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

const ADMIN_NAV = [
  { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/admin/settings", labelKey: "siteSettings", icon: ImageIcon },
  { href: "/admin/restaurants", labelKey: "restaurants", icon: Store },
  { href: "/admin/suppliers", labelKey: "suppliers", icon: Building2 },
  { href: "/admin/people", labelKey: "people", icon: Users2 },
  { href: "/admin/news", labelKey: "news", icon: Newspaper },
  { href: "/admin/contact", labelKey: "contactInbox", icon: Mail },
  { href: "/admin/membership", labelKey: "membershipApplications", icon: Users },
  { href: "/admin/assessments", labelKey: "selfAssessments", icon: ClipboardCheck },
  { href: "/admin/change-requests", labelKey: "changeRequests", icon: ListChecks },
  { href: "/admin/marketplace", labelKey: "marketplaceModeration", icon: Tag },
  { href: "/admin/sustainability", labelKey: "sustainabilityBenchmarks", icon: Leaf },
  { href: "/admin/legal", labelKey: "legalDocuments", icon: Scale },
  { href: "/admin/training", labelKey: "trainingCourses", icon: GraduationCap },
  { href: "/admin/magazine", labelKey: "magazineArticles", icon: BookOpen },
  { href: "/admin/knowledge", labelKey: "knowledgeHub", icon: Library },
  { href: "/admin/newsletter", labelKey: "newsletterSubscribers", icon: Send },
] as const;

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    redirect("/login");
  }
  const tn = await getTranslations("admin.nav");

  // The `admin` namespace is withheld from the public client bundle, so the
  // back-office re-provides the full message set here. `locale` is passed
  // explicitly: the client provider throws without one, and letting the
  // server wrapper infer it means an extra read of the request headers.
  const messages = await getMessages();

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[220px_1fr] lg:gap-8">
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 lg:flex-col lg:overflow-visible lg:pb-0">
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-surface-2 hover:text-ink"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {tn(item.labelKey)}
          </Link>
        ))}
      </nav>
      <div className="min-w-0">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </div>
    </div>
  );
}
