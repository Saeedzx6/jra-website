import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { signPrivateUrl } from "@/lib/storage";

/**
 * Gatekeeper for applicant documents (trade licences, ownership papers).
 *
 * These are uploaded to Cloudinary as `authenticated` assets, so they have no
 * public URL at all. Staff reach them only through this route, which checks the
 * session and then redirects to a signature that expires in five minutes.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ publicId: string[] }> }
) {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { publicId } = await params;
  const id = publicId.map(decodeURIComponent).join("/");

  // The public_id always sits under the folder we control; anything else is a
  // probe and gets rejected rather than signed.
  if (!id.startsWith("jra/")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.redirect(signPrivateUrl(id, 300));
}
