import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


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


const LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/login":                        { max: 5,  windowMs: 15 * 60 * 1000 },
  "/api/forgot-password/send-code":    { max: 3,  windowMs: 15 * 60 * 1000 },
  "/api/forgot-password/reset":        { max: 5,  windowMs: 15 * 60 * 1000 },
  "/api/verify-code":                  { max: 5,  windowMs: 15 * 60 * 1000 },
  "/api/register":                     { max: 10, windowMs: 60 * 60 * 1000 },
  "/api/admin/verify-password":        { max: 5,  windowMs: 15 * 60 * 1000 },
  "/api/verify-password":              { max: 10, windowMs: 15 * 60 * 1000 },
};

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const limit = LIMITS[pathname];

  if (limit) {
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
