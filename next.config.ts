import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "jra.jo" },
      { protocol: "https", hostname: "www.jra.jo" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Next's default, pinned explicitly so it is a decision rather than an
  // accident. Browser source maps would publish readable copies of every
  // client component — including the admin UI — to anyone who opens devtools.
  // Server-side stack traces are unaffected; those never leave the server.
  productionBrowserSourceMaps: false,

  // Drops `X-Powered-By: Next.js` from every response. It tells a visitor
  // nothing and tells a scanner which CVE list to try first.
  poweredByHeader: false,

  experimental: {
    serverActions: {
      // Next's default is 1 MB, which is smaller than essentially every photo
      // a phone takes. Over it, the platform returns 413 before the action
      // runs — so the size check inside the action never executed and the
      // client saw an unhandled error instead of a message. That was every
      // failed upload in the back office.
      //
      // 4 MB rather than more: Vercel caps a serverless function's request
      // body at 4.5 MB, so a larger number here would only move the failure
      // from our error message to their platform error. Images are downscaled
      // in the browser before upload (see lib/prepare-image.ts), so this is a
      // backstop rather than the thing users hit.
      bodySizeLimit: "4mb",
    },
  },
};

export default withNextIntl(nextConfig);
