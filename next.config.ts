import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true, 
  },
  serverExternalPackages: ["mongoose"],
  experimental: {
    webpackBuildWorker: true,
    parallelServerCompiles: false,
  }
};

export default nextConfig;
