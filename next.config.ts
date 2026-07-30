import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  allowedDevOrigins: ['192.168.0.102'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
