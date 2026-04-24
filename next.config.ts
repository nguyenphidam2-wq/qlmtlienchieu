import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true, // Tiết kiệm RAM khi build/dev
  },
  eslint: {
    ignoreDuringBuilds: true, // Tiết kiệm RAM khi build/dev
  },
  experimental: {
    // Tối ưu hóa bộ nhớ cho môi trường dev/build
    webpackBuildWorker: false,
    parallelServerCompiles: false,
  }
};

export default nextConfig;
