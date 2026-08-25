import jwt from "jsonwebtoken";
import { env } from "@/lib/env";

export type AuthTokenPayload = {
  userId: string;
  username?: string;
  role: string;
  tv?: number;
};

function getJwtSecret(): string {
  const secret = env("JWT_SECRET");
  if (secret) {
    return secret;
  }

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
