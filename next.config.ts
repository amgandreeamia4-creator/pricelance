import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental server actions for App Router
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
  
  // React compiler disabled
  reactCompiler: false,
};

export default nextConfig;
