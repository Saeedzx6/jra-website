/**
 * Proves applicant documents are genuinely private:
 *   1. the plain (unsigned) CDN URL must NOT serve the file
 *   2. the signed URL the admin route mints MUST serve it
 *
 *   npx dotenv -e .env.production.local -- node scripts/check-private-doc.mjs <publicId>
 */
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const publicId = process.argv[2];
if (!publicId) {
  console.error("Usage: node scripts/check-private-doc.mjs <publicId>");
  process.exit(1);
}

let failures = 0;

// 1. Unsigned delivery URL — should be refused.
const unsigned = cloudinary.url(publicId, { type: "authenticated", secure: true });
const a = await fetch(unsigned, { method: "HEAD" });
if (a.ok) {
  console.log(`  ✗ unsigned URL served the file (${a.status}) — NOT private`);
  failures++;
} else {
  console.log(`  ✓ unsigned URL refused (${a.status})`);
}

// 2. Signed, expiring URL — should work.
const signed = cloudinary.url(publicId, {
  type: "authenticated",
  sign_url: true,
  secure: true,
  expires_at: Math.floor(Date.now() / 1000) + 300,
});
const b = await fetch(signed, { method: "HEAD" });
if (b.ok) {
  console.log(`  ✓ signed URL served the file (${b.status}, ${b.headers.get("content-type")})`);
} else {
  console.log(`  ✗ signed URL failed (${b.status}) — admins could not open documents`);
  failures++;
}

console.log(failures === 0 ? "\nPrivate document handling correct.\n" : `\n${failures} problem(s).\n`);
process.exitCode = failures === 0 ? 0 : 1;
