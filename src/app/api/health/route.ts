import { NextResponse } from "next/server";
import { hasEnv, env } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: hasEnv("JWT_SECRET") && hasEnv("DATABASE_URL"),
    configured: {
      JWT_SECRET: hasEnv("JWT_SECRET"),
      DATABASE_URL: hasEnv("DATABASE_URL"),
      NEXT_PUBLIC_APP_URL: hasEnv("NEXT_PUBLIC_APP_URL"),
      EMAIL_USER: hasEnv("EMAIL_USER"),
    },
    appUrl: env("NEXT_PUBLIC_APP_URL") || null,
    hint: !hasEnv("JWT_SECRET")
      ? "Add JWT_SECRET in Vercel → Settings → Environment Variables, then Redeploy."
      : !hasEnv("DATABASE_URL")
        ? "Add DATABASE_URL in Vercel → Settings → Environment Variables, then Redeploy."
        : "Environment looks configured. Visit /api/seed-admin once to create the default admin account.",
  });
}
