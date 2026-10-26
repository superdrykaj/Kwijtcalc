import type { NextConfig } from "next";

/**
 * KwijtCalc draait volledig in de browser: er is geen server, database of
 * API-route. Daardoor zijn twee manieren van publiceren mogelijk.
 *
 *  - Standaard: een gewone Next.js-build, bijvoorbeeld voor Vercel.
 *  - Met STATIC_EXPORT=true: losse bestanden in de map `out`, te uploaden naar
 *    gewone webhosting. Zie "Publiceren" in README.md.
 */
const staticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(staticExport
    ? {
        output: "export" as const,
        // Mappen met een index.html werken op elke webserver, ook zonder
        // herschrijfregels voor adressen als /beroep.
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
