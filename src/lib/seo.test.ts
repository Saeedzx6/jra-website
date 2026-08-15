import { describe, expect, it } from "vitest";
import { alternatesFor, localeUrl, toDescription } from "./seo";

describe("localeUrl", () => {
  it("builds a locale-prefixed absolute URL", () => {
    expect(localeUrl("en", "/restaurants")).toMatch(/\/en\/restaurants$/);
    expect(localeUrl("ar", "/restaurants/zorba")).toMatch(/\/ar\/restaurants\/zorba$/);
  });

  it("produces no trailing slash for the locale root", () => {
    expect(localeUrl("en", "/")).toMatch(/\/en$/);
  });

  it("normalises leading and trailing slashes so callers can pass either", () => {
    expect(localeUrl("en", "news/")).toBe(localeUrl("en", "/news"));
  });
});

describe("alternatesFor", () => {
  it("pairs both locales and points x-default at the default locale", () => {
    const alt = alternatesFor("ar", "/restaurants") as {
      canonical: string;
      languages: Record<string, string>;
    };

    expect(alt.canonical).toMatch(/\/ar\/restaurants$/);
    expect(alt.languages.en).toMatch(/\/en\/restaurants$/);
    expect(alt.languages.ar).toMatch(/\/ar\/restaurants$/);
    // Without this the Arabic and English pages compete as duplicate content.
    expect(alt.languages["x-default"]).toBe(alt.languages.en);
  });

  it("canonicalises each locale to itself, not to the default", () => {
    const en = alternatesFor("en", "/news") as { canonical: string };
    const ar = alternatesFor("ar", "/news") as { canonical: string };
    expect(en.canonical).not.toBe(ar.canonical);
  });
});

describe("toDescription", () => {
  it("strips tags and collapses whitespace", () => {
    expect(toDescription("<p>Hello   <strong>world</strong></p>")).toBe("Hello world");
  });

  it("decodes the entities that appear in seeded copy", () => {
    expect(toDescription("<p>Fish &amp; chips</p>")).toBe("Fish & chips");
    expect(toDescription("<p>He said &quot;yes&quot;</p>")).toBe('He said "yes"');
  });

  it("returns undefined for empty or tag-only input so callers can fall back", () => {
    expect(toDescription(null)).toBeUndefined();
    expect(toDescription("")).toBeUndefined();
    expect(toDescription("<p></p>")).toBeUndefined();
  });

  it("truncates on a word boundary and never exceeds the limit", () => {
    const source = "alpha bravo ".repeat(40).trim();
    const out = toDescription(`<p>${source}</p>`, 60)!;

    expect(out.length).toBeLessThanOrEqual(60);
    expect(out.endsWith("…")).toBe(true);

    // The real property: dropping the ellipsis must leave an exact prefix of
    // the source that stops at a word boundary — i.e. the next character in the
    // source is a space, never the middle of a word. Cutting mid-word is what
    // makes a meta description look broken in a search result.
    const body = out.slice(0, -1);
    expect(source.startsWith(body)).toBe(true);
    expect(source[body.length]).toBe(" ");
  });

  it("leaves text shorter than the limit untouched", () => {
    expect(toDescription("<p>Short enough</p>", 100)).toBe("Short enough");
  });
});
