import type { NextConfig } from "next";

/**
 * KwijtCalc draait volledig in de browser: er is geen server, database of
 * API-route. Daardoor zijn er meerdere manieren van publiceren.
 *
 *  - Standaard: een gewone Next.js-build, bijvoorbeeld voor Vercel.
 *  - STATIC_EXPORT=true: losse bestanden in de map `out`, te uploaden naar
 *    gewone webhosting.
 *  - BASE_PATH=/kwijtcalc: de site draait in een submap van een bestaande
 *    website, bijvoorbeeld hoogbeeldmedia.nl/kwijtcalc. Zonder deze instelling
 *    zoekt de pagina haar bestanden in de hoofdmap en blijft het scherm leeg.
 *
 * Zie "Publiceren" in README.md.
 */
const staticExport = process.env.STATIC_EXPORT === "true";
const basePath = process.env.BASE_PATH?.trim() ?? "";

if (basePath !== "" && !/^\/[A-Za-z0-9-_/]*[A-Za-z0-9-_]$/.test(basePath)) {
  throw new Error(
    `BASE_PATH moet beginnen met een schuine streep en niet eindigen met een schuine streep, bijvoorbeeld /kwijtcalc. Gekregen: ${basePath}`,
  );
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(basePath !== "" ? { basePath, assetPrefix: basePath } : {}),
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
