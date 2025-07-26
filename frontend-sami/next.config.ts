import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone mode for Docker
  output: 'standalone',
  
  // Image optimization
  images: {
    unoptimized: true,
  },
  
  // Experimental features
  experimental: {
    // Any experimental features can go here
  },
};

export default nextConfig;
