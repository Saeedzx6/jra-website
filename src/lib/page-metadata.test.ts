import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { publicClientMessages } from "@/i18n/client-messages";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";

const APP = join(process.cwd(), "src", "app", "[locale]");

function pagesUnder(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) pagesUnder(p, out);
    else if (entry === "page.tsx") out.push(p);
  }
  return out;
}

/** Public pages only — /admin and /portal are noindex and behind a session. */
function publicPages(): string[] {
  return pagesUnder(APP).filter((p) => {
    const segs = relative(APP, p).split(sep);
    return segs[0] !== "admin" && segs[0] !== "portal";
  });
}

describe("page metadata coverage", () => {
  /**
   * Every public page must declare its own metadata.
   *
   * This is not a style rule. Metadata in the App Router is inherited, so a
   * page without its own picks up the locale layout's — including its
   * `alternates.canonical`, which points at the homepage. A page whose
   * canonical names a different URL is asking search engines not to index it.
   * Twenty-two pages were in that state before this test existed.
   *
   * The homepage is the one legitimate exception: the layout's canonical is
   * already its own.
   */
  it("every public page declares generateMetadata", () => {
    const missing = publicPages()
      .filter((p) => relative(APP, p) !== "page.tsx")
      .filter((p) => !readFileSync(p, "utf8").includes("generateMetadata"))
      .map((p) => relative(process.cwd(), p));

    expect(missing).toEqual([]);
  });

  it("the homepage inherits the layout's metadata, which is canonical for /", () => {
    const layout = readFileSync(join(APP, "layout.tsx"), "utf8");
    expect(layout).toContain('alternatesFor(locale, "/")');
  });
});

describe("meta message keys", () => {
  const referenced = publicPages()
    .flatMap((p) => [...readFileSync(p, "utf8").matchAll(/pageMetadata\("[^"]+", "([^"]+)"/g)])
    .map((m) => m[1]);

  it("finds the keys the pages actually ask for", () => {
    expect(referenced.length).toBeGreaterThan(15);
  });

  it.each(["en", "ar"])("%s defines a title and description for each", (locale) => {
    const meta = (locale === "en" ? en : ar).meta as Record<string, string>;
    const missing = referenced.flatMap((key) =>
      [`${key}Title`, `${key}Description`].filter((k) => !meta[k]?.trim())
    );
    expect(missing).toEqual([]);
  });

  it("keeps both locales in step", () => {
    expect(Object.keys(en.meta).sort()).toEqual(Object.keys(ar.meta).sort());
  });
});

describe("publicClientMessages", () => {
  it("withholds the namespaces no public browser reads", () => {
    const out = publicClientMessages(en as never) as Record<string, unknown>;
    expect(out.admin).toBeUndefined();
    expect(out.meta).toBeUndefined();
  });

  it("keeps everything a public client component might resolve", () => {
    const out = publicClientMessages(en as never) as Record<string, unknown>;
    // SiteHeader and PrimaryNav call useTranslations() with no namespace and
    // resolve dotted keys from the root, so `nav` in particular must survive.
    for (const ns of ["nav", "common", "home", "errors", "footer", "restaurants"]) {
      expect(out[ns], ns).toBeDefined();
    }
  });

  it("does not mutate the messages it was given", () => {
    const before = Object.keys(en).length;
    publicClientMessages(en as never);
    expect(Object.keys(en).length).toBe(before);
  });
});
