import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // wllama multi-thread 지원을 위한 필수 헤더
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  turbopack: {
    resolveAlias: {
      "@wllama/wllama": "@wllama/wllama/esm/index.js",
    },
  },
};

export default nextConfig;
