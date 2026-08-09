/**
 * Generates the production admin password and AUTH_SECRET, appending them to
 * .env.production.local. Values are never printed — only a length and a 4-char
 * fingerprint, so the secrets stay out of terminal scrollback and transcripts.
 *
 * Open .env.production.local in a text editor to read the actual password.
 * Existing values are left alone; delete a line and re-run to rotate it.
 *
 *   node scripts/gen-prod-secrets.mjs [admin-email]
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const FILE = path.join(process.cwd(), ".env.production.local");
if (!fs.existsSync(FILE)) {
  console.error("✗ .env.production.local not found");
  process.exit(1);
}

const email = process.argv[2];
if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/gen-prod-secrets.mjs you@example.com");
  process.exit(1);
}

const fp = (v) => crypto.createHash("sha256").update(v).digest("hex").slice(0, 4);

/** Ambiguous characters removed so the password can be read off a screen. */
function password(length = 24) {
  const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%^*-_";
  const bytes = crypto.randomBytes(length * 2);
  let out = "";
  for (let i = 0; out.length < length && i < bytes.length; i++) {
    const idx = bytes[i];
    // Reject the tail of the byte range so every character is equally likely.
    if (idx >= 256 - (256 % alphabet.length)) continue;
    out += alphabet[idx % alphabet.length];
  }
  return out;
}

let body = fs.readFileSync(FILE, "utf8");
const has = (key) => new RegExp(`^\\s*${key}\\s*=`, "m").test(body);
const added = [];

function ensure(key, value, label) {
  if (has(key)) {
    console.log(`  = ${key} already set, left unchanged`);
    return;
  }
  body += `${key}="${value}"\n`;
  added.push(key);
  console.log(`  + ${key} generated (${label}, fp ${fp(value)})`);
}

if (!body.endsWith("\n")) body += "\n";
body += "\n# --- generated credentials (read them in this file, never paste them) ---\n";

ensure("ADMIN_EMAIL", email, email);
ensure("ADMIN_PASSWORD", password(24), "24 chars");
ensure("AUTH_SECRET", crypto.randomBytes(32).toString("base64"), "32 bytes base64");

fs.writeFileSync(FILE, body);
console.log(
  added.length
    ? `\nWrote ${added.length} value(s) to .env.production.local — open it to read them.\n`
    : "\nNothing to do; all values already present.\n"
);
