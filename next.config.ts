import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore - The types might be slightly behind the experimental feature or specific version
  allowedDevOrigins: ["localhost", "127.0.0.1", "0.0.0.0", "10.0.90.203"],
};

export default nextConfig;
