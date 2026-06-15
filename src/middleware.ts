import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// In-memory rate limiter (resets on cold-start / redeploy — good enough for
// Vercel serverless. For persistent limits, replace with Upstash Redis.)
// ---------------------------------------------------------------------------

type RateLimitEntry = { count: number; resetAt: number };
const store = new Map<string, RateLimitEntry>();

function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
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

// ---------------------------------------------------------------------------
// Route-specific limits
// ---------------------------------------------------------------------------

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/login":                        { max: 5,  windowMs: 15 * 60 * 1000 }, // 5 / 15 min
  "/api/forgot-password/send-code":    { max: 3,  windowMs: 15 * 60 * 1000 }, // 3 / 15 min
  "/api/forgot-password/reset":        { max: 5,  windowMs: 15 * 60 * 1000 }, // 5 / 15 min
  "/api/verify-code":                  { max: 5,  windowMs: 15 * 60 * 1000 }, // 5 / 15 min
  "/api/register":                     { max: 10, windowMs: 60 * 60 * 1000 }, // 10 / hour
  "/api/admin/verify-password":        { max: 5,  windowMs: 15 * 60 * 1000 }, // 5 / 15 min
  "/api/verify-password":              { max: 10, windowMs: 15 * 60 * 1000 }, // 10 / 15 min
};

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const limit = LIMITS[pathname];

  if (limit) {
    // Key = IP + path  (falls back to "unknown" if IP header is absent)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const key = `${ip}:${pathname}`;
    const { allowed, retryAfterSec } = rateLimit(key, limit.max, limit.windowMs);

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
