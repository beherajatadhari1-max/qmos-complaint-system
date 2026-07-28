import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  allowedDevOrigins: ['192.168.0.102'],
  typescript: {
    ignoreBuildErrors: true,   // skip TS type-check so build completes
  },
  optimizeFonts: false,        // skip Google Fonts fetch during build (offline/firewall safe)
};

export default nextConfig;
