import type { AbstractIntlMessages } from "next-intl";

/**
 * Namespaces held back from the public client bundle.
 *
 * `NextIntlClientProvider` serialises whatever it is given into the RSC
 * payload of every page, so the whole message file was being shipped to every
 * visitor: 25 KB of English or 35 KB of Arabic on a page that might use one
 * string of it.
 *
 * Two namespaces are provably never read in a public browser:
 *
 *   meta   — titles and descriptions, consumed only by `generateMetadata`,
 *            which runs on the server and never hydrates.
 *   admin  — the back-office UI, behind a session check. Its pages re-provide
 *            it from `admin/layout.tsx`, so nothing there loses access.
 *
 * Together they are roughly 40% of the file. Everything else stays, because
 * `SiteHeader` and `PrimaryNav` call `useTranslations()` with no namespace and
 * resolve dotted keys at the root — trimming further would mean auditing every
 * such call, and the remaining namespaces are small.
 */
const WITHHELD = ["meta", "admin"] as const;

export function publicClientMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  const out: AbstractIntlMessages = { ...messages };
  for (const namespace of WITHHELD) delete out[namespace];
  return out;
}
