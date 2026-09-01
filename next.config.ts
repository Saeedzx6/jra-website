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
};

export default withNextIntl(nextConfig);
