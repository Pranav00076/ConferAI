import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-device local testing
  allowedDevOrigins: ['192.168.1.8', 'localhost'],
};

export default nextConfig;
