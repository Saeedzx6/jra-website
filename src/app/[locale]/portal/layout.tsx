import { redirect } from "next/navigation";
import { getSession } from "@/lib/rbac";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user || !["RESTAURANT_MEMBER", "SUPPLIER_MEMBER", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  return <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</div>;
}
