/**
 * Bouwt KwijtCalc als losse bestanden in de map `out`, voor gewone webhosting.
 *
 * Deze omweg bestaat omdat het zetten van een omgevingsvariabele op Windows
 * anders gaat dan op macOS en Linux. Zo werkt `npm run build:static` overal
 * hetzelfde, zonder extra pakket.
 */
import { spawnSync } from "node:child_process";

const result = spawnSync("next", ["build"], {
  stdio: "inherit",
  env: { ...process.env, STATIC_EXPORT: "true" },
  // Op Windows is `next` een .cmd-bestand; dat start alleen via de shell.
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
