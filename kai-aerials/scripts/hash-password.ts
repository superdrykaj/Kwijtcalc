/**
 * Maakt een wachtwoord-hash en een sessiesleutel voor de beheeromgeving.
 *
 *   npm run hash-password -- 'mijn-lange-wachtwoord'
 *
 * Zet beide regels uit de uitvoer in .env.local.
 */
import crypto from "node:crypto";

import { hashPassword } from "../lib/password";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error(
    "Geef een wachtwoord van minstens 10 tekens:\n" +
      "  npm run hash-password -- 'mijn-lange-wachtwoord'",
  );
  process.exit(1);
}

console.log(`ADMIN_PASSWORD_HASH="${hashPassword(password)}"`);
console.log(`AUTH_SECRET="${crypto.randomBytes(32).toString("base64url")}"`);
