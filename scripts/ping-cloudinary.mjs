/**
 * Confirms the Cloudinary credentials work and reports remaining free quota.
 *
 *   npx dotenv -e .env.production.local -- node scripts/ping-cloudinary.mjs
 */
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

try {
  const ping = await cloudinary.api.ping();
  console.log(`ping: ${ping.status}`);
  console.log(`cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);

  const usage = await cloudinary.api.usage();
  const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
  console.log(`stored assets: ${usage.resources ?? 0}`);
  console.log(`storage used:  ${mb(usage.storage?.usage ?? 0)}`);
  console.log(`credits used:  ${usage.credits?.used_percent ?? 0}%`);
  console.log("OK");
} catch (e) {
  console.error("FAIL:", e?.message ?? e);
  process.exitCode = 1;
}
