import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { SCANNER_ALLOWED_ROLES, AuthTokenPayload } from "@/lib/auth-edge";

export type ScannerUser = {
  userId: string;
  role: string;
};

/**
 * Returns the verified user from the auth_token cookie directly.
 * Uses jsonwebtoken since this runs in a Server Component (Node.js runtime).
 */
export async function getScannerUser(): Promise<ScannerUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    console.log("[getScannerUser] No auth_token found");
    return null;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const payload = verify(token, secret) as AuthTokenPayload;
    if (!payload) {
      console.log("[getScannerUser] Token verification failed");
      return null;
    }

    const role = payload.role.toUpperCase();

    if (!SCANNER_ALLOWED_ROLES.has(role)) {
      console.log("[getScannerUser] Role not allowed:", role);
      return null;
    }

    return { userId: payload.userId, role };
  } catch (error) {
    console.error("[getScannerUser] Error verifying token", error);
    return null;
  }
}
