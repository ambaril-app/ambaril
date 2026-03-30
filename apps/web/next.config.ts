import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ambaril/ui", "@ambaril/shared", "@ambaril/db", "@ambaril/email"],
  serverExternalPackages: ["ws", "@neondatabase/serverless", "@node-rs/argon2"],
  turbopack: {
    root: "../../",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
