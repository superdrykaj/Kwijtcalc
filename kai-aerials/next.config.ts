import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Deze map is de projectroot; er staat een tweede lockfile boven ons.
  turbopack: { root: import.meta.dirname },
  images: {
    // Placeholder-beelden worden lokaal geserveerd; uploads gaan via /api/uploads.
    localPatterns: [
      { pathname: "/images/**" },
      { pathname: "/api/uploads/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  // Native module: mag niet door de bundler worden meegenomen.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
