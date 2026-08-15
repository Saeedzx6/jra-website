import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Without this Turbopack walks up looking for a lockfile, finds a stray one
  // in the user's home directory and warns that it is ignoring it. Pinning the
  // root to this package keeps module resolution inside the project.
  turbopack: {
    root: __dirname,
  },
  images: {
    // Venue photography still points at the association's own CDN. HANDOFF
    // flags self-hosting as production work; until then these hosts are
    // allow-listed explicitly rather than disabling optimisation wholesale.
    remotePatterns: [
      { protocol: "https", hostname: "jra.jo" },
      { protocol: "https", hostname: "www.jra.jo" },
      // Hero video poster frame. The video itself is a plain <video> element
      // and needs no allow-listing here; only next/image sources do.
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
