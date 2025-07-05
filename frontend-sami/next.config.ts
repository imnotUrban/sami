import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone mode for Docker
  output: 'standalone',
  
  // Image optimization
  images: {
    unoptimized: true,
  },
  
  // Disable telemetry
  telemetry: false,
};

export default nextConfig;
