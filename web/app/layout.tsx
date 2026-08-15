import type { ReactNode } from "react";

/**
 * Deliberately thin. <html> and <body> are emitted by app/[locale]/layout.tsx,
 * because lang and dir cannot be resolved until the locale segment is known.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
