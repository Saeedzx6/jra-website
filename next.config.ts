import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Pinned because an unrelated package-lock.json in the parent directory made
  // Next infer the workspace root as C:\Users\<user>, which puts file tracing
  // for the serverless bundle in the wrong place.
  outputFileTracingRoot: __dirname,
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
};

export default withNextIntl(nextConfig);
