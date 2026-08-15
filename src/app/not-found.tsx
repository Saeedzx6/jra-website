import Link from "next/link";
import { routing } from "@/i18n/routing";

/**
 * Root 404 — the fallback for URLs that match no route at all, such as a
 * doubled locale prefix (/en/en/admin) or a stray path.
 *
 * The locale-scoped not-found only covers `notFound()` raised from inside a
 * page, so without this one those URLs fell through to Next's stock page:
 * unbranded, English-only, no header or footer.
 *
 * Deliberately self-contained. This renders outside `[locale]`, so there is no
 * request locale, no NextIntlClientProvider and no SiteHeader available — it
 * carries its own minimal styling and offers both languages rather than
 * guessing one.
 */
export default function RootNotFound() {
  return (
    <html lang={routing.defaultLocale} dir="ltr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-paper, #f7f7f8)",
          color: "var(--color-ink, #1c1e22)",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <main style={{ maxWidth: "28rem" }}>
          <p
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-accent, #0050a0)",
              margin: 0,
            }}
          >
            Jordan Restaurant Association
          </p>

          <h1 style={{ fontSize: "1.75rem", lineHeight: 1.2, margin: "1rem 0 0" }}>
            We can&rsquo;t find that page
          </h1>
          <p style={{ margin: "0.75rem 0 0", color: "var(--color-ink-soft, #585d64)" }}>
            The address may be mistyped or out of date.
          </p>

          <p
            dir="rtl"
            lang="ar"
            style={{ margin: "1.25rem 0 0", color: "var(--color-ink-soft, #585d64)" }}
          >
            لا يمكننا العثور على هذه الصفحة. قد يكون العنوان غير صحيح أو لم يعد متاحًا.
          </p>

          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Plain anchors, not next-intl's Link — there is no locale context here. */}
            <a
              href="/en"
              style={{
                borderRadius: "999px",
                background: "var(--color-accent, #0050a0)",
                color: "#fff",
                padding: "0.7rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              English
            </a>
            <a
              href="/ar"
              style={{
                borderRadius: "999px",
                border: "1px solid var(--color-rule, #e5e7eb)",
                color: "var(--color-ink, #1c1e22)",
                padding: "0.7rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              العربية
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
