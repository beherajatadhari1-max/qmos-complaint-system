import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  allowedDevOrigins: ['192.168.0.102'],
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-expect-error eslint is valid Next.js config but missing from some type versions
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
};

export default nextConfig;
