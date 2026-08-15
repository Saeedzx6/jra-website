import createMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { authConfig } from "./lib/auth.config";

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

/**
 * Areas that require a session, and the roles allowed into each.
 *
 * These duplicate the checks already in `admin/layout.tsx` and
 * `portal/layout.tsx` on purpose — the layouts stay as the authoritative gate
 * (middleware cannot be the only check), while this makes the default posture
 * fail-closed. Previously a new route added outside those two layouts was
 * public until someone remembered to guard it.
 */
const PROTECTED_AREAS = [
  { segment: "admin", roles: ["ADMIN", "EDITOR"] },
  { segment: "portal", roles: ["RESTAURANT_MEMBER", "SUPPLIER_MEMBER", "ADMIN"] },
] as const;

export default auth((req) => {
  const segments = req.nextUrl.pathname.split("/").filter(Boolean);

  // Paths always carry a locale prefix (localePrefix: "always"), but a request
  // can arrive before the intl middleware has added one — handle both shapes.
  const hasLocale = (routing.locales as readonly string[]).includes(segments[0] ?? "");
  const locale = hasLocale ? segments[0] : routing.defaultLocale;
  const area = hasLocale ? segments[1] : segments[0];

  const rule = PROTECTED_AREAS.find((a) => a.segment === area);
  if (rule) {
    const role = req.auth?.user?.role;
    if (!role || !(rule.roles as readonly string[]).includes(role)) {
      const loginUrl = new URL(`/${locale}/login`, req.nextUrl.origin);
      // So a signed-out user landing on a deep link returns there afterwards.
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
