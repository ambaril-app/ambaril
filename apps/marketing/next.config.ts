import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ambaril/email"],
  turbopack: {
    root: "../../",
  },
};

export default nextConfig;
