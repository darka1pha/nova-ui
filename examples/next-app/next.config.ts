import type { NextConfig } from "next";

const config: NextConfig = {
  // Nova UI is one barrel export; this keeps each route's bundle to the components it uses.
  experimental: { optimizePackageImports: ["@darkalpha/nova-ui"] },
};

export default config;
