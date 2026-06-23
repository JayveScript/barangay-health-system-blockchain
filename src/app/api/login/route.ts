import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { sign } from "jsonwebtoken";

const MAX_ATTEMPTS = 5;
const WINDOW_MS    = 15 * 60 * 1000; // 15 minutes

async function checkRateLimit(ip: string): Promise<{ blocked: boolean; retryAfterSec: number }> {
  const now  = new Date();
  const key  = `login:${ip}`;

  try {
    const record = await (db as any).loginAttempt.findUnique({ where: { key } });

    if (!record || now > record.windowEnd) {
      // No record or window expired — fresh window, allow
      return { blocked: false, retryAfterSec: 0 };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      const retryAfterSec = Math.ceil((record.windowEnd.getTime() - now.getTime()) / 1000);
      return { blocked: true, retryAfterSec };
    }
  } catch {
    // If LoginAttempt table doesn't exist yet, fail open (don't block login)
  }

  return { blocked: false, retryAfterSec: 0 };
}

async function recordFailedAttempt(ip: string): Promise<void> {
  const key     = `login:${ip}`;
  const now     = new Date();
  const windowEnd = new Date(now.getTime() + WINDOW_MS);

  try {
    const existing = await (db as any).loginAttempt.findUnique({ where: { key } });

    if (!existing || now > existing.windowEnd) {
      await (db as any).loginAttempt.upsert({
        where:  { key },
        update: { attempts: 1, windowEnd, updatedAt: now },
        create: { key, attempts: 1, windowEnd },
      });
    } else {
      await (db as any).loginAttempt.update({
        where: { key },
        data:  { attempts: { increment: 1 }, updatedAt: now },
      });
    }
  } catch {
    // Fail silently if table isn't available
  }
}

async function clearAttempts(ip: string): Promise<void> {
  try {
    await (db as any).loginAttempt.deleteMany({ where: { key: `login:${ip}` } });
  } catch { /* ignore */ }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing.");
      return NextResponse.json(
        { error: "Server authentication is not configured." },
        { status: 500 }
      );
    }

    // ── Rate limit check ────────────────────────────────────────────────────
    const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    const { blocked, retryAfterSec } = await checkRateLimit(ip);
    if (blocked) {
      return NextResponse.json(
        { error: `Too many failed login attempts. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).` },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    const normalizedIdentifier = String(identifier).trim();

    const user = await db.user.findFirst({
      where: {
        OR: [
          { username: normalizedIdentifier },
          { email: normalizedIdentifier.toLowerCase() },
        ],
      },
    });

    if (!user) {
      await recordFailedAttempt(ip);
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: "Account is not verified." },
        { status: 403 }
      );
    }

    const isValid = await compare(String(password), user.password);

    if (!isValid) {
      await recordFailedAttempt(ip);
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    // ── Successful login — clear any recorded failed attempts ───────────────
    await clearAttempts(ip);

    const token = sign(
      {
        userId: user.id,
        role: user.role,
        tv: user.tokenVersion,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    const res = NextResponse.json({
      success: true,
      role: user.role,
      userId: user.id,
    });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return res;
  } catch (error) {
    console.error("LOGIN_ERROR", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}