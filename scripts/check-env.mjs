/**
 * Validates .env.production.local without ever printing a secret.
 *
 * Passwords and API secrets are shown only as a length and a 4-char fingerprint,
 * which is enough to tell "I pasted the new one" from "I pasted the old one"
 * without the value appearing on screen or in a transcript.
 *
 *   npm run env:check
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const FILE = path.join(process.cwd(), ".env.production.local");

if (!fs.existsSync(FILE)) {
  console.error("✗ .env.production.local not found");
  process.exit(1);
}

const env = {};
for (const line of fs.readFileSync(FILE, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

/** Stable short hash — same secret gives the same 4 chars, reveals nothing. */
const fp = (v) => crypto.createHash("sha256").update(v).digest("hex").slice(0, 4);
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => {
  console.log(`  ✗ ${m}`);
  failures++;
};
let failures = 0;

console.log("\nDatabase");
for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  const raw = env[key];
  if (!raw) {
    bad(`${key} missing`);
    continue;
  }
  let u;
  try {
    u = new URL(raw);
  } catch {
    bad(`${key} is not a valid URL`);
    continue;
  }
  const pooled = u.hostname.includes("-pooler");
  const wantPooled = key === "DATABASE_URL";
  if (pooled !== wantPooled) {
    bad(`${key} should ${wantPooled ? "" : "NOT "}use the -pooler host`);
  } else {
    ok(`${key} → ${u.hostname}${u.pathname} (password len ${u.password.length}, fp ${fp(u.password)})`);
  }
  if (raw.includes("channel_binding")) {
    bad(`${key} still has channel_binding — Prisma may fail to connect`);
  }
  if (!raw.includes("sslmode=require")) bad(`${key} is missing sslmode=require`);
}

if (env.DATABASE_URL && env.DIRECT_URL) {
  try {
    const a = new URL(env.DATABASE_URL).password;
    const b = new URL(env.DIRECT_URL).password;
    if (a !== b) bad("DATABASE_URL and DIRECT_URL have different passwords");
    else ok("both URLs share the same password");
  } catch {
    /* already reported above */
  }
}

console.log("\nCloudinary");
const cloudKeys = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
if (cloudKeys.every((k) => !env[k])) {
  console.log("  – not set yet (image migration will not run)");
} else {
  for (const key of cloudKeys) {
    const v = env[key];
    if (!v) bad(`${key} missing`);
    else if (key === "CLOUDINARY_CLOUD_NAME") ok(`${key} = ${v}`);
    else ok(`${key} set (len ${v.length}, fp ${fp(v)})`);
  }
}

console.log("\nAuth");
if (!env.AUTH_SECRET) console.log("  – AUTH_SECRET not set here (set it in your host's dashboard)");
else if (env.AUTH_SECRET.length < 32) bad("AUTH_SECRET looks too short");
else ok(`AUTH_SECRET set (len ${env.AUTH_SECRET.length}, fp ${fp(env.AUTH_SECRET)})`);

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} problem(s) above.\n`);
process.exit(failures === 0 ? 0 : 1);
