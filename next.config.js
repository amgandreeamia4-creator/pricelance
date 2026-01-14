/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Next.js produces a server build (not static only)
  output: "standalone",

  // Optional: enable experimental server actions for App Router
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
