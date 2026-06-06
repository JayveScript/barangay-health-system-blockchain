import jwt from "jsonwebtoken";

export type AuthTokenPayload = {
  userId: string;
  username: string;
  role: string;
};

function getJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  // Allow `next build` to finish when env vars are not set yet (e.g. first Vercel deploy).
  if (process.env.npm_lifecycle_event === "build") {
    return "__build_placeholder__";
  }

  throw new Error("JWT_SECRET is missing. Add it in Vercel Environment Variables.");
}

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
}
