import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


type RateLimitEntry = { count: number; resetAt: number };

// Keep the counter map on globalThis so it survives module re-evaluation within
// a single serverless instance. NOTE: this is still per-instance. For limits
// that hold across ALL Vercel instances (the fully robust version), back this
// with Vercel KV / Upstash Redis (edge-compatible over fetch) and swap the
// Map calls below for KV reads/writes.
const globalForRateLimit = globalThis as unknown as {
  __rateLimitStore?: Map<string, RateLimitEntry>;
};
const store = globalForRateLimit.__rateLimitStore ?? new Map<string, RateLimitEntry>();
globalForRateLimit.__rateLimitStore = store;

function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();

  // Opportunistic cleanup so the map can't grow without bound.
  if (store.size > 5000) {
    for (const [k, v] of store) {
      if (now > v.resetAt) store.delete(k);
    }
  }

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (entry.count >= maxRequests) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

// Shared, cross-instance limiter backed by Upstash Redis (edge-compatible over
// its REST API — no SDK needed). It activates automatically when
// UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set in the environment;
// otherwise, and on any Redis error, it falls back to the per-instance
// in-memory limiter so requests are never blocked by an infra problem.
async function rateLimitShared(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // INCR the counter, set the window TTL only on first hit (NX), read TTL.
        body: JSON.stringify([
          ["INCR", key],
          ["PEXPIRE", key, String(windowMs), "NX"],
          ["PTTL", key],
        ]),
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as Array<{ result: number }>;
        const count = Number(data?.[0]?.result ?? 0);
        const pttl = Number(data?.[2]?.result ?? windowMs);
        if (count > maxRequests) {
          return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(pttl / 1000)) };
        }
        return { allowed: true, retryAfterSec: 0 };
      }
    } catch {
      // fall through to the in-memory limiter
    }
  }

  return rateLimit(key, maxRequests, windowMs);
}


const LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/login":                        { max: 5,  windowMs: 15 * 60 * 1000 },
  "/api/forgot-password/send-code":    { max: 3,  windowMs: 15 * 60 * 1000 },
  "/api/forgot-password/reset":        { max: 5,  windowMs: 15 * 60 * 1000 },
  "/api/verify-code":                  { max: 5,  windowMs: 15 * 60 * 1000 },
  "/api/register":                     { max: 10, windowMs: 60 * 60 * 1000 },
  "/api/admin/verify-password":        { max: 5,  windowMs: 15 * 60 * 1000 },
  "/api/verify-password":              { max: 10, windowMs: 15 * 60 * 1000 },
};

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const limit = LIMITS[pathname];

  if (limit) {
    // Prefer x-real-ip (set by Vercel to the true client IP; not client-
    // spoofable through the platform). Fall back to the LAST hop of
    // x-forwarded-for — the entry added by the closest trusted proxy — rather
    // than the leftmost value, which a client can forge to rotate fake IPs.
    const xff = req.headers.get("x-forwarded-for");
    const ip =
      req.headers.get("x-real-ip")?.trim() ||
      xff?.split(",").map((s) => s.trim()).filter(Boolean).pop() ||
      "unknown";

    const key = `rl:${pathname}:${ip}`;
    const { allowed, retryAfterSec } = await rateLimitShared(key, limit.max, limit.windowMs);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/login",
    "/api/register",
    "/api/forgot-password/send-code",
    "/api/forgot-password/reset",
    "/api/verify-code",
    "/api/admin/verify-password",
    "/api/verify-password",
  ],
};
