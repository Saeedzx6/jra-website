/**
 * Drafts the Arabic for any key that has English and no Arabic.
 *
 * Why this exists
 * ---------------
 * `messages/en.json` and `messages/ar.json` have to hold the same keys --
 * `src/lib/messages.test.ts` fails the build otherwise, because next-intl does
 * not fail on a missing key, it prints the key itself, and the first sign of
 * one is `admin.about.saveSeconds` sitting on a button in production.
 *
 * That test turns "I forgot the Arabic" into a red build, which is right, but
 * it also means adding an English string means writing an Arabic one. This
 * script writes the first draft so that is never the thing blocking a change.
 *
 * What it will not do
 * -------------------
 * It never touches a key that already has Arabic. The 657 strings in there
 * were written by people, and machine translation is a downgrade on every one
 * of them -- short UI labels especially, where "Save" without context can come
 * back as the verb when the button wants the noun. This fills gaps; it does
 * not re-translate.
 *
 * Every key it writes is listed in `messages/ar.review.json` so a human can
 * see exactly what is provisional. That file is a list of key paths, nothing
 * more -- ar.json stays plain JSON that next-intl can load.
 *
 * Usage
 * -----
 *   node scripts/i18n-fill.mjs --dry     # show what it would write
 *   node scripts/i18n-fill.mjs           # write it
 *
 * Needs ANTHROPIC_API_KEY in .env.local. Add it to that file yourself -- do
 * not paste a key onto a command line, where it lands in your shell history.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const EN = path.join(ROOT, "messages/en.json");
const AR = path.join(ROOT, "messages/ar.json");
const REVIEW = path.join(ROOT, "messages/ar.review.json");
const MODEL = "claude-sonnet-5";
const DRY = process.argv.includes("--dry");

/** Reads KEY=value from .env.local without pulling in a dotenv dependency. */
function envFromFile(name) {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return undefined;
  const line = fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${name}=`));
  return line?.slice(name.length + 1).replace(/^["']|["']$/g, "");
}

const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

/** Every leaf as a dotted path, so `restaurants.location` keeps its context. */
function flatten(tree, prefix = "") {
  return Object.entries(tree).reduce((acc, [key, value]) => {
    const p = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") Object.assign(acc, flatten(value, p));
    else acc[p] = value;
    return acc;
  }, {});
}

/** Writes a dotted path into the tree, creating the objects it passes through. */
function setPath(tree, dotted, value) {
  const parts = dotted.split(".");
  let node = tree;
  for (const part of parts.slice(0, -1)) {
    if (typeof node[part] !== "object" || node[part] === null) node[part] = {};
    node = node[part];
  }
  node[parts.at(-1)] = value;
}

/**
 * Rebuilds `target` so its keys sit in the same order as `reference`.
 * The catalogues are compared for order by the test, and a key appended to the
 * bottom of whichever file was edited first is how they drift apart.
 */
function reorder(target, reference) {
  if (typeof reference !== "object" || reference === null) return target;
  const out = {};
  for (const key of Object.keys(reference)) {
    if (!(key in target)) continue;
    out[key] = reorder(target[key], reference[key]);
  }
  for (const key of Object.keys(target)) if (!(key in out)) out[key] = target[key];
  return out;
}

const en = read(EN);
const ar = read(AR);
const flatEn = flatten(en);
const flatAr = flatten(ar);

const missing = Object.keys(flatEn).filter(
  (k) => !(k in flatAr) || String(flatAr[k]).trim() === ""
);

if (missing.length === 0) {
  console.log("Nothing to fill: every English key already has Arabic.");
  process.exit(0);
}

console.log(`${missing.length} key(s) need Arabic:`);
for (const k of missing) console.log(`  ${k}\n    en: ${JSON.stringify(flatEn[k])}`);

if (DRY) {
  console.log("\n--dry: nothing written.");
  process.exit(0);
}

const apiKey = process.env.ANTHROPIC_API_KEY ?? envFromFile("ANTHROPIC_API_KEY");
if (!apiKey) {
  console.error(
    "\nANTHROPIC_API_KEY is not set.\n" +
      "Add it to .env.local as a line reading ANTHROPIC_API_KEY=... and run this again.\n" +
      "Do not pass it on the command line."
  );
  process.exit(1);
}

/**
 * One request for the whole batch rather than one per key: the model sees the
 * other strings, so terminology stays consistent across a screen instead of
 * the same noun arriving three ways.
 */
const prompt = `You are translating UI strings for the Jordan Restaurant Association's
bilingual website (نقابة أصحاب المطاعم الأردنية). The audience is Jordanian
restaurant owners and the public; Arabic is their first language, so the Arabic
must read as though it was written first, not translated.

Rules:
- Use Modern Standard Arabic as used in Jordanian professional and official contexts.
- Keep every {placeholder} EXACTLY as it appears, same spelling, same count.
  These are interpolated at runtime; changing or dropping one breaks the page.
- The key path tells you the role of the string. A key under "nav" or ending
  in "Label"/"Cta" is a short control: translate it as a label, not a sentence.
- Do not add punctuation the English does not have.
- Do not transliterate English words that have ordinary Arabic equivalents.

Return ONLY a JSON object mapping each key path to its Arabic string. No prose,
no code fence.

${JSON.stringify(Object.fromEntries(missing.map((k) => [k, flatEn[k]])), null, 2)}`;

const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: MODEL,
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  }),
});

if (!response.ok) {
  console.error(`Anthropic API ${response.status}: ${await response.text()}`);
  process.exit(1);
}

const body = await response.json();
const text = body.content.map((c) => c.text ?? "").join("").trim();

let drafted;
try {
  drafted = JSON.parse(text.replace(/^```(?:json)?\n?|\n?```$/g, ""));
} catch {
  console.error("The model did not return JSON. It said:\n", text.slice(0, 500));
  process.exit(1);
}

/** The placeholders must survive, or the test that guards them will fail. */
const tokens = (s) => [...String(s).matchAll(/\{(\w+)/g)].map((m) => m[1]).sort().join();

let written = 0;
const rejected = [];
for (const key of missing) {
  const value = drafted[key];
  if (typeof value !== "string" || !value.trim()) {
    rejected.push(`${key}: nothing returned`);
    continue;
  }
  if (tokens(value) !== tokens(flatEn[key])) {
    rejected.push(`${key}: placeholders changed (${tokens(flatEn[key])} -> ${tokens(value)})`);
    continue;
  }
  setPath(ar, key, value);
  written++;
}

const ordered = reorder(ar, en);
fs.writeFileSync(AR, JSON.stringify(ordered, null, 2) + "\n", "utf8");

const previous = fs.existsSync(REVIEW) ? read(REVIEW) : [];
const review = [...new Set([...previous, ...missing.filter((k) => !rejected.some((r) => r.startsWith(k)))])];
fs.writeFileSync(REVIEW, JSON.stringify(review, null, 2) + "\n", "utf8");

console.log(`\nWrote ${written} Arabic string(s) into messages/ar.json.`);
console.log(`${review.length} key(s) now listed in messages/ar.review.json awaiting a human read.`);
if (rejected.length) {
  console.log("\nNot written, write these by hand:");
  for (const r of rejected) console.log("  " + r);
}
