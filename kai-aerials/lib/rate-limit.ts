import "server-only";

/**
 * Eenvoudige snelheidsbegrenzing in het geheugen.
 * Bedoeld om formulierspam af te remmen op één server.
 * Draai je op meerdere servers, gebruik dan een gedeelde opslag (bijvoorbeeld Redis).
 */

type Bucket = { count: number; resetAt: number };

declare global {
  var __kaiRateLimit: Map<string, Bucket> | undefined;
}

function store(): Map<string, Bucket> {
  if (!globalThis.__kaiRateLimit) globalThis.__kaiRateLimit = new Map();
  return globalThis.__kaiRateLimit;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const map = store();

  // Verlopen sleutels opruimen zodat de map niet blijft groeien.
  if (map.size > 500) {
    for (const [k, v] of map) if (v.resetAt < now) map.delete(k);
  }

  const bucket = map.get(key);
  if (!bucket || bucket.resetAt < now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}
