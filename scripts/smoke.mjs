/**
 * Route smoke test. Requests every public route in both locales against a
 * running server and checks it returns 200 with real content.
 *
 *   npm run dev            # in one terminal
 *   npm run smoke          # in another
 *   BASE_URL=… npm run smoke
 *
 * This is deliberately not a vitest test: the unit suite runs in a bare node
 * environment with no server and no database, and should stay that way so it
 * is fast and runnable anywhere. This checks the thing those cannot — that the
 * pages actually render.
 */
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3001";

/** Routes that should render for an anonymous visitor. */
const PUBLIC_PATHS = [
  "/",
  "/restaurants",
  "/suppliers",
  "/about",
  "/about/reports",
  "/membership",
  "/classification",
  "/contact",
  "/news",
  "/magazine",
  "/training",
  "/jobs",
  "/knowledge",
  "/legal",
  "/marketplace",
  "/opportunities",
  "/projects",
  "/sustainability",
  "/login",
];

/** Routes that must bounce an anonymous visitor to the login page. */
const PROTECTED_PATHS = ["/admin", "/portal"];

const LOCALES = ["en", "ar"];

/** Below this, a 200 is a shell with no content in it. */
const MIN_BYTES = 20_000;

let failures = 0;
const note = (ok, message) => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${message}`);
};

async function checkPublic(locale, path) {
  const url = `${BASE}/${locale}${path === "/" ? "" : path}`;
  let response;
  try {
    response = await fetch(url, { redirect: "manual" });
  } catch (error) {
    note(false, `${url} — request failed: ${error.message}`);
    return;
  }

  if (response.status !== 200) {
    note(false, `${url} — expected 200, got ${response.status}`);
    return;
  }

  const body = await response.text();
  const bigEnough = body.length >= MIN_BYTES;

  // A page that 200s while still showing its loading fallback is a failure
  // that status codes alone will not catch.
  const stuckLoading = body.includes("<!--$~-->");

  note(
    bigEnough && !stuckLoading,
    `${url} — ${response.status}, ${body.length} bytes${stuckLoading ? " (STUCK ON LOADING FALLBACK)" : ""}${
      bigEnough ? "" : ` (under ${MIN_BYTES} bytes)`
    }`,
  );
}

async function checkProtected(locale, path) {
  const url = `${BASE}/${locale}${path}`;
  const response = await fetch(url, { redirect: "manual" });
  const location = response.headers.get("location") ?? "";
  const redirected = [301, 302, 307, 308].includes(response.status);
  note(
    redirected && location.includes("/login"),
    `${url} — ${response.status} -> ${location || "(no redirect)"} (expected redirect to /login)`,
  );
}

async function main() {
  console.log(`Smoke-testing ${BASE}\n`);

  for (const locale of LOCALES) {
    console.log(`--- ${locale} — public ---`);
    for (const path of PUBLIC_PATHS) await checkPublic(locale, path);

    console.log(`--- ${locale} — protected ---`);
    for (const path of PROTECTED_PATHS) await checkProtected(locale, path);
    console.log("");
  }

  // Detail routes come from the generated snapshot, so pick real slugs.
  const { restaurants, suppliers } = await import("../src/data/vocab.json", {
    with: { type: "json" },
  })
    .then(() => import("../src/data/restaurants.json", { with: { type: "json" } }))
    .then(async (r) => ({
      restaurants: r.default,
      suppliers: (await import("../src/data/suppliers.json", { with: { type: "json" } })).default,
    }));

  console.log("--- detail routes ---");
  for (const locale of LOCALES) {
    if (restaurants[0]) await checkPublic(locale, `/restaurants/${restaurants[0].slug}`);
    if (suppliers[0]) await checkPublic(locale, `/suppliers/${suppliers[0].slug}`);
  }

  const total = LOCALES.length * (PUBLIC_PATHS.length + PROTECTED_PATHS.length) + LOCALES.length * 2;
  console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`} — ${total} checks`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
