import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { MembershipApplicationRow } from "@/components/admin/membership-row";

export default async function AdminMembershipPage() {
  const applications = await db.membershipApplication.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  const tn = await getTranslations("admin.nav");
  const tm = await getTranslations("admin.membership");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">
        {tn("membershipApplications")}
      </h1>
      <div className="mt-6 space-y-3">
        {applications.map((a) => (
          <MembershipApplicationRow
            key={a.id}
            id={a.id}
            businessName={a.businessName}
            contactName={a.contactName}
            email={a.email}
            applicantType={a.applicantType}
            documents={a.documents as never}
          />
        ))}
        {applications.length === 0 && (
          <p className="text-ink-soft">{tm("noPendingApplications")}</p>
        )}
      </div>
    </div>
  );
}
