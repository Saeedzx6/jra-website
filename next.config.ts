import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Hero poster frame. The clip is stock footage hotlinked from Pexels
      // (free licence); self-hosting it is production work, see lib/hero-media.ts.
      { protocol: "https", hostname: "images.pexels.com" },
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
};

export default withNextIntl(nextConfig);
