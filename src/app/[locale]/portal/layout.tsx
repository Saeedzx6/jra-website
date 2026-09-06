import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/rbac";

/**
 * Signed-in areas must never be indexed. robots.txt already disallows these
 * paths, but robots.txt is a crawl instruction, not an index instruction — a
 * URL linked from elsewhere can still be listed without being fetched. The
 * meta tag is what actually keeps it out.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user || !["RESTAURANT_MEMBER", "SUPPLIER_MEMBER", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  return <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</div>;
}
