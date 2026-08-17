import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { routing } from "@/i18n/routing";

/**
 * The message catalogues were produced by merging the ported front end's
 * namespaces over the platform's. next-intl throws at RENDER time for a
 * missing key, so a namespace that survived the merge in English but not in
 * Arabic is a 500 on an Arabic page and nothing earlier catches it.
 *
 * These also guard the direction of that merge: the ported pages own the
 * public namespaces, the admin and portal keys had to survive.
 */

const MESSAGES_DIR = path.join(process.cwd(), "messages");
const SRC_DIR = path.join(process.cwd(), "src");

function load(locale: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf8"));
}

/** Every leaf key path, e.g. "nav.login". */
function leafKeys(value: unknown, trail: string[] = [], out: string[] = []): string[] {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) leafKeys(child, [...trail, key], out);
  } else {
    out.push(trail.join("."));
  }
  return out;
}

const catalogues = Object.fromEntries(routing.locales.map((l) => [l, load(l)]));

describe("message catalogues", () => {
  it("exists for every configured locale", () => {
    for (const locale of routing.locales) {
      expect(Object.keys(catalogues[locale]!).length).toBeGreaterThan(0);
    }
  });

  it("has identical key sets across locales", () => {
    const [reference, ...others] = routing.locales;
    const referenceKeys = leafKeys(catalogues[reference!]).sort();

    for (const locale of others) {
      const keys = leafKeys(catalogues[locale]).sort();
      const missing = referenceKeys.filter((k) => !keys.includes(k));
      const extra = keys.filter((k) => !referenceKeys.includes(k));
      expect({ locale, missing, extra }).toEqual({ locale, missing: [], extra: [] });
    }
  });

  it("has no empty strings — a blank label renders as a gap, not an error", () => {
    for (const locale of routing.locales) {
      const blanks: string[] = [];
      const walk = (value: unknown, trail: string[]) => {
        if (value && typeof value === "object") {
          for (const [k, v] of Object.entries(value)) walk(v, [...trail, k]);
        } else if (typeof value === "string" && value.trim() === "") {
          blanks.push(trail.join("."));
        }
      };
      walk(catalogues[locale], []);
      expect({ locale, blanks }).toEqual({ locale, blanks: [] });
    }
  });

  it("kept the platform-only namespaces the admin and portal read", () => {
    // These come from the platform half of the merge. If the front end's
    // catalogue had replaced rather than merged, these would be gone and every
    // admin page would throw.
    for (const locale of routing.locales) {
      const keys = leafKeys(catalogues[locale]);
      for (const ns of ["admin.", "meta."]) {
        expect(keys.some((k) => k.startsWith(ns))).toBe(true);
      }
    }
  });

  it("kept the ported front end's namespaces", () => {
    for (const locale of routing.locales) {
      const top = Object.keys(catalogues[locale]!);
      for (const ns of ["brand", "nav", "search", "home", "directory", "footer", "modules"]) {
        expect(top).toContain(ns);
      }
    }
  });

  it("no longer claims the login form is a prototype", () => {
    // The form is wired to the credential provider now; the notice saying
    // otherwise would be a lie that also discourages real sign-in.
    for (const locale of routing.locales) {
      const login = catalogues[locale]!.login as Record<string, string> | undefined;
      expect(login && "demoNotice" in login).toBe(false);
    }
  });
});

describe("namespaces referenced in code", () => {
  /** Collects getTranslations("x") / useTranslations("x") arguments. */
  function usedNamespaces(dir: string, found = new Set<string>()): Set<string> {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        usedNamespaces(full, found);
        // Test files are skipped: this file's own doc comment shows the
        // pattern being matched, and the scan would otherwise find it.
      } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
        const source = readFileSync(full, "utf8");
        for (const match of source.matchAll(/(?:useTranslations|getTranslations)\(\s*"([^"]+)"/g)) {
          found.add(match[1]!);
        }
        // getTranslations({ locale, namespace: "x" })
        for (const match of source.matchAll(/namespace:\s*"([^"]+)"/g)) {
          found.add(match[1]!);
        }
      }
    }
    return found;
  }

  it("every namespace the code asks for exists in both locales", () => {
    const used = [...usedNamespaces(SRC_DIR)].sort();
    expect(used.length).toBeGreaterThan(0);

    for (const locale of routing.locales) {
      const catalogue = catalogues[locale]!;
      const missing = used.filter((ns) => {
        // Namespaces can be dotted, e.g. "admin.settings".
        let node: unknown = catalogue;
        for (const part of ns.split(".")) {
          if (!node || typeof node !== "object") return true;
          node = (node as Record<string, unknown>)[part];
        }
        return node === undefined;
      });
      expect({ locale, missing }).toEqual({ locale, missing: [] });
    }
  });
});
