import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Permite fotos de crianças servidas do S3 (definir bucket via env quando integrar).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
};

export default nextConfig;
