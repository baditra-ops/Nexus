import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for Docker/self-hosting; Vercel deploys natively as serverless
  output: process.env.VERCEL ? undefined : "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
