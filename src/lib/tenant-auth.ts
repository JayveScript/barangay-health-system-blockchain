import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth";
export {
  BARANGAY_ADMIN_USERNAME_REGEX,
  BARANGAY_ADMIN_USERNAME_SUFFIX,
  isValidBarangayAdminUsername,
} from "@/lib/username-validation";

export async function getCurrentApiUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);

    return await db.user.findUnique({
      where: { id: payload.userId },
      include: {
        barangay: true,
        resident: true,
      },
    });
  } catch {
    return null;
  }
}

export function isBarangayAdmin(user: { role?: unknown } | null | undefined) {
  return String(user?.role || "") === "BARANGAY_ADMIN";
}

export function isSuperAdmin(user: { role?: unknown } | null | undefined) {
  return String(user?.role || "") === "SUPER_ADMIN";
}

export function canManageBarangay(user: { role?: unknown } | null | undefined) {
  return isBarangayAdmin(user) || isSuperAdmin(user);
}
