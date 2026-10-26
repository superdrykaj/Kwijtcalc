/**
 * Bouwt KwijtCalc als losse bestanden in de map `out`, voor gewone webhosting.
 *
 * Een submap meegeven kan met een argument of met BASE_PATH:
 *   npm run build:static -- /kwijtcalc
 *
 * Deze omweg bestaat omdat het zetten van een omgevingsvariabele op Windows
 * anders gaat dan op macOS en Linux. Zo werkt het overal hetzelfde, zonder
 * extra pakket.
 */
import { spawnSync } from "node:child_process";

const argument = process.argv[2]?.trim();
const basePath = argument ?? process.env.BASE_PATH ?? "";

if (basePath !== "") {
  console.log(`Bouwen voor een submap: ${basePath}`);
}

const result = spawnSync("next", ["build"], {
  stdio: "inherit",
  env: { ...process.env, STATIC_EXPORT: "true", BASE_PATH: basePath },
  // Op Windows is `next` een .cmd-bestand; dat start alleen via de shell.
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
