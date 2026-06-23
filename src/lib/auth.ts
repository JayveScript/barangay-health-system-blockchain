import jwt from "jsonwebtoken";
import { env } from "@/lib/env";

export type AuthTokenPayload = {
  userId: string;
  username?: string;
  role: string;
  // Session version — must match the user's current tokenVersion, otherwise the
  // session has been revoked (e.g. after a password reset).
  tv?: number;
};

function getJwtSecret(): string {
  const secret = env("JWT_SECRET");
  if (secret) {
    return secret;
  }

  // Allow `next build` to finish when env vars are not set yet (e.g. first Vercel deploy).
  if (process.env.npm_lifecycle_event === "build") {
    return "__build_placeholder__";
  }

  throw new Error("JWT_SECRET is missing. Add it in Vercel Environment Variables.");
}

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "1d",
  });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
}
