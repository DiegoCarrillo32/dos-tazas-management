import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  output: "standalone",
  // The design system ships untranspiled TSX so Tailwind can scan it.
  transpilePackages: ["dos-tazas-design-system"],
};

export default withSerwist(nextConfig);
