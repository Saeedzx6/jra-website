import { db } from "@/lib/db";

/**
 * Plain read of the singleton site-settings row.
 *
 * This deliberately does NOT live in lib/actions/settings.ts. That file is
 * marked "use server", so every export in it is a Server Action — including
 * what looked like an ordinary getter. The homepage awaited it during render
 * while also declaring `revalidate = 300`; invoking a Server Action from a
 * statically-revalidated render postpones the surrounding Suspense boundary,
 * and the resume never runs, so the page served its loading.tsx fallback
 * forever with the real markup stranded in a hidden div.
 *
 * Reads belong here; the mutations that genuinely need to be actions stay in
 * lib/actions/settings.ts.
 */
export async function getSiteSettings() {
  return db.siteSetting.findUnique({ where: { id: "singleton" } });
}
