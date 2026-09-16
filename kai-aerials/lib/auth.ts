import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";

import { hashPassword, verifyPassword } from "./password";

/**
 * Beheerderslogin.
 *
 * - ADMIN_PASSWORD_HASH bevat een scrypt-hash van het wachtwoord (zie
 *   `npm run hash-password`). Het wachtwoord zelf staat nergens in de code.
 * - AUTH_SECRET ondertekent het sessiecookie.
 *
 * Beide waarden staan alleen op de server, nooit in de frontend.
 */

const COOKIE_NAME = "kai_admin_session";
const SESSION_HOURS = 12;

export class AuthNotConfiguredError extends Error {}

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new AuthNotConfiguredError(
      "AUTH_SECRET ontbreekt of is te kort. Zie .env.example.",
    );
  }
  return secret;
}

export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_SECRET &&
      process.env.AUTH_SECRET.length >= 16 &&
      process.env.ADMIN_PASSWORD_HASH,
  );
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", authSecret())
    .update(payload)
    .digest("base64url");
}

function createToken(): string {
  const payload = JSON.stringify({
    sub: "admin",
    exp: Date.now() + SESSION_HOURS * 3600000,
    jti: crypto.randomBytes(8).toString("hex"),
  });
  const body = Buffer.from(payload).toString("base64url");
  return `${body}.${sign(body)}`;
}

function readToken(token: string): boolean {
  const [body, signature] = token.split(".");
  if (!body || !signature) return false;
  const expected = sign(body);
  if (
    expected.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return false;
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString());
    return parsed.sub === "admin" && typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

/** Controleert het wachtwoord en zet bij succes het sessiecookie. */
export { hashPassword, verifyPassword };

export async function signIn(password: string): Promise<boolean> {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) throw new AuthNotConfiguredError("ADMIN_PASSWORD_HASH ontbreekt.");
  if (!verifyPassword(password, stored)) return false;

  const jar = await cookies();
  jar.set(COOKIE_NAME, createToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  return true;
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** True als de huidige bezoeker is ingelogd als beheerder. */
export async function isSignedIn(): Promise<boolean> {
  if (!isAuthConfigured()) return false;
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  return Boolean(token && readToken(token));
}

/**
 * Gooit een fout als de bezoeker niet is ingelogd.
 * Roep dit aan in elke server action en elke beheerpagina.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isSignedIn())) {
    throw new Error("Niet toegestaan. Log opnieuw in.");
  }
}
