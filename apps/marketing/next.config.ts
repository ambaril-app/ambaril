import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  transpilePackages: ["@ambaril/email"],
  turbopack: {
    root: "../../",
  },
};

export default nextConfig;
