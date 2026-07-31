import type { NextConfig } from "next";
import path from "node:path";

if (process.env.CI && !process.env.API_BASE_URL) {
  throw new Error("API_BASE_URL is required for production CI builds");
}

const apiBaseUrl = (process.env.API_BASE_URL || "http://localhost:8787").replace(/\/$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiBaseUrl}/api/:path*` },
    ]
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
