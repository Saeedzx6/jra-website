"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Makes the session readable from client components.
 *
 * Deliberately thin. The alternative — calling `auth()` in the locale layout —
 * reads cookies, which opts every page in the site out of static rendering to
 * put one name in the header. This keeps the pages static and fetches the
 * session from the browser after hydration.
 *
 * `refetchOnWindowFocus` is off: the session lasts thirty days, so re-checking
 * it every time someone alt-tabs back is a request per focus for information
 * that has not changed.
 */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>;
}
