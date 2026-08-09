import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) return new NextResponse("Forbidden", { status: 403 });

  const { sessionId } = await params;
  const registrations = await db.courseRegistration.findMany({
    where: { courseSessionId: sessionId },
    orderBy: { createdAt: "asc" },
  });

  const header = "Full Name,Email,Phone,Status,Registered At";
  const rows = registrations.map((r) =>
    [r.fullName, r.email, r.phone ?? "", r.status, r.createdAt.toISOString()]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations-${sessionId}.csv"`,
    },
  });
}
