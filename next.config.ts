import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
