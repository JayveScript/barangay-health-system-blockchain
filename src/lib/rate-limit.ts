import { db } from "@/lib/db";

// Lightweight, DB-backed fixed-window rate limiter built on the existing
// LoginAttempt table (key + attempts + windowEnd). It is intentionally
// fail-open: if the database is briefly unreachable we let the request
// through rather than lock legitimate users out. Use distinct key prefixes
// per action (e.g. "otp-send:", "otp-verify:") so counters never collide.

export type RateLimitResult = {
  blocked: boolean;
  retryAfterSec: number;
  remaining: number;
};

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
}

export async function checkRateLimit(
  key: string,
  max: number
): Promise<RateLimitResult> {
  const now = new Date();
  try {
    const record = await (db as any).loginAttempt.findUnique({ where: { key } });

    if (!record || now > record.windowEnd) {
      return { blocked: false, retryAfterSec: 0, remaining: max };
    }

    if (record.attempts >= max) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((record.windowEnd.getTime() - now.getTime()) / 1000)
      );
      return { blocked: true, retryAfterSec, remaining: 0 };
    }

    return { blocked: false, retryAfterSec: 0, remaining: max - record.attempts };
  } catch {
    return { blocked: false, retryAfterSec: 0, remaining: max };
  }
}

export async function recordAttempt(key: string, windowMs: number): Promise<void> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMs);

  try {
    const existing = await (db as any).loginAttempt.findUnique({ where: { key } });

    if (!existing || now > existing.windowEnd) {
      // Fresh window: reset the counter and start a new window.
      await (db as any).loginAttempt.upsert({
        where: { key },
        update: { attempts: 1, windowEnd, updatedAt: now },
        create: { key, attempts: 1, windowEnd },
      });
    } else {
      // Still inside the current window: just increment.
      await (db as any).loginAttempt.update({
        where: { key },
        data: { attempts: { increment: 1 }, updatedAt: now },
      });
    }
  } catch {
    // Fail-open: never block a request because the limiter write failed.
  }
}

export async function clearAttempts(key: string): Promise<void> {
  try {
    await (db as any).loginAttempt.deleteMany({ where: { key } });
  } catch {
    // ignore
  }
}

export function tooManyRequests(retryAfterSec: number, message: string) {
  // Imported lazily to keep this module free of Next-specific deps at the top.
  // Callers build the NextResponse themselves; this is just a shared message.
  return {
    body: { error: message },
    status: 429 as const,
    headers: { "Retry-After": String(retryAfterSec) },
  };
}
