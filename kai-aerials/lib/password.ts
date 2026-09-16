import crypto from "node:crypto";

/**
 * Wachtwoord-hashing met scrypt.
 *
 * Formaat: `scrypt:<salt hex>:<hash hex>`. De dubbele punt wordt gebruikt
 * omdat een dollarteken in .env-bestanden wordt gelezen als verwijzing naar
 * een andere variabele, waardoor de hash stilletjes zou worden uitgehold.
 */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.trim().split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    if (salt.length === 0 || expected.length === 0) return false;
    const derived = crypto.scryptSync(password, salt, expected.length);
    return crypto.timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}
