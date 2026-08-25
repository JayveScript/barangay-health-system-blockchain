import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth";

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

    if (user.tokenVersion !== (payload.tv ?? 0)) return null;

    return user as Prisma.UserGetPayload<{ include: I }>;
  } catch {
    return null;
  }
}
