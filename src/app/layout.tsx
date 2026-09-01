/**
 * Pass-through root layout.
 *
 * Every real page lives under `[locale]/`, whose layout renders <html> and
 * <body> because it is the only place the locale and text direction are
 * known. But `not-found.tsx` sits here at the root, outside that segment, to
 * catch URLs that match no locale — and Next requires any page it renders to
 * have a root layout above it. Without this file the root 404 throws
 * "not-found.tsx doesn't have a root layout", and in dev that error then
 * poisons every subsequent request, so a single /favicon.ico miss takes the
 * whole dev server down until it is restarted.
 *
 * This returns children untouched: the document shell stays in
 * `[locale]/layout.tsx`, and `not-found.tsx` carries its own.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
