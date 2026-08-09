/**
 * Writes .env.vercel.local containing ONLY the variables the deployed app
 * needs, copied from .env.production.local.
 *
 * ADMIN_EMAIL / ADMIN_PASSWORD are deliberately excluded: they are inputs to a
 * one-off seed script run from a laptop, not runtime configuration, and there
 * is no reason for the admin password to live in a hosting dashboard.
 *
 * Values are copied without ever being printed.
 *
 *   node scripts/make-vercel-env.mjs
 */
import fs from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), ".env.production.local");
const OUT = path.join(process.cwd(), ".env.vercel.local");

const NEEDED = [
  "DATABASE_URL",
  "DIRECT_URL",
  "AUTH_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

if (!fs.existsSync(SRC)) {
  console.error("✗ .env.production.local not found");
  process.exit(1);
}

const env = {};
for (const line of fs.readFileSync(SRC, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const lines = [];
let missing = 0;
for (const key of NEEDED) {
  if (!env[key]) {
    console.log(`  ✗ ${key} missing from .env.production.local`);
    missing++;
    continue;
  }
  lines.push(`${key}=${env[key]}`);
  console.log(`  ✓ ${key}`);
}

if (missing) {
  console.error(`\n${missing} value(s) missing — not writing the file.\n`);
  process.exit(1);
}

fs.writeFileSync(OUT, lines.join("\n") + "\n");
console.log(`\nWrote ${lines.length} variables to .env.vercel.local`);
console.log("Upload it with Vercel's \"Import .env\" button, then delete it.\n");
