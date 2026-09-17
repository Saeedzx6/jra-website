import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";

/**
 * The two catalogues have to stay in step.
 *
 * A key present in one and missing from the other does not fail the build --
 * next-intl falls back to printing the key itself, so the first sign of it is
 * an Arabic page with `admin.about.saveSeconds` sitting on a button. The same
 * goes for the `{name}` placeholders: a phrase translated without one silently
 * drops the value it was supposed to interpolate.
 *
 * Order is checked too, so a key added in a hurry lands beside its siblings in
 * both files rather than at the bottom of whichever one was edited first.
 */
type Tree = { [k: string]: string | Tree };

function paths(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : [path, ...paths(value, path)];
  });
}

function leaves(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") acc[path] = value;
    else Object.assign(acc, leaves(value, path));
    return acc;
  }, {});
}

/** The `{name}` tokens ICU will substitute into a phrase. */
function placeholders(message: string): string[] {
  return [...message.matchAll(/\{(\w+)/g)].map((m) => m[1]!).sort();
}

const enPaths = paths(en as Tree);
const arPaths = paths(ar as Tree);
const enLeaves = leaves(en as Tree);
const arLeaves = leaves(ar as Tree);

describe("message catalogues", () => {
  it("has no key in English that Arabic is missing", () => {
    expect(enPaths.filter((p) => !arPaths.includes(p))).toEqual([]);
  });

  it("has no key in Arabic that English is missing", () => {
    expect(arPaths.filter((p) => !enPaths.includes(p))).toEqual([]);
  });

  it("keeps both files in the same order", () => {
    expect(arPaths).toEqual(enPaths);
  });

  it("interpolates the same values in both languages", () => {
    const drifted = Object.keys(enLeaves)
      .filter((k) => arLeaves[k] !== undefined)
      .filter((k) => placeholders(enLeaves[k]!).join() !== placeholders(arLeaves[k]!).join())
      .map((k) => `${k}: en=${placeholders(enLeaves[k]!)} ar=${placeholders(arLeaves[k]!)}`);
    expect(drifted).toEqual([]);
  });

  it("has no blank translations", () => {
    expect(Object.entries(arLeaves).filter(([, v]) => v.trim() === "").map(([k]) => k)).toEqual([]);
    expect(Object.entries(enLeaves).filter(([, v]) => v.trim() === "").map(([k]) => k)).toEqual([]);
  });
});
