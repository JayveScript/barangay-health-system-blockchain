import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth";

/**
 * Resolve the authenticated user from the `auth_token` cookie, enforcing
 * session revocation: the token's `tv` (token version) must match the user's
 * current `tokenVersion`. Bumping a user's tokenVersion (e.g. on a password
 * reset) immediately invalidates every existing token for that user.
 *
 * Pass a Prisma `include` to eager-load relations (typed accordingly).
 */
export async function resolveAuthedUser<
  I extends Prisma.UserInclude = Record<string, never>
>(include?: I): Promise<Prisma.UserGetPayload<{ include: I }> | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include,
    });

    if (!user) return null;

    // Session revocation check.
    if (user.tokenVersion !== (payload.tv ?? 0)) return null;

    return user as Prisma.UserGetPayload<{ include: I }>;
  } catch {
    return null;
  }
}
