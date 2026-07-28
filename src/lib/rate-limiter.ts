/**
 * Simple in-memory rate limiter.
 *
 * Tracks attempts per key (e.g. IP address) within a time window.
 * In Cloudflare Workers, this Map lives in the global isolate scope
 * and persists across requests within the same isolate lifetime.
 *
 * For production use, replace with a KV-backed or WAF-based rate limiter
 * for consistent enforcement across all Workers instances.
 */

interface AttemptRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, AttemptRecord>();

/**
 * Check if the given key has exceeded the rate limit.
 * Returns { allowed: boolean, remaining: number, resetAt: number }.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();

  // Clean up expired entries periodically
  if (now % 60000 < 100) {
    for (const [k, record] of store) {
      if (now > record.resetAt) {
        store.delete(k);
      }
    }
  }

  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
  }

  record.count += 1;

  if (record.count > maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetAt: record.resetAt,
  };
}
