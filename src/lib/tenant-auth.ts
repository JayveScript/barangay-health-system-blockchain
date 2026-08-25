import { resolveAuthedUser } from "@/lib/api-auth";
export {
  BARANGAY_ADMIN_USERNAME_REGEX,
  BARANGAY_ADMIN_USERNAME_SUFFIX,
  isValidBarangayAdminUsername,
} from "@/lib/username-validation";

export async function getCurrentApiUser() {
  return resolveAuthedUser({ barangay: true, resident: true });
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

export function resolveScopeBarangayId(
  user: { role?: unknown; barangayId?: string | null } | null | undefined,
  requestedBarangayId?: string | null
): string {
  if (isSuperAdmin(user) && requestedBarangayId) {
    return String(requestedBarangayId);
  }
  return String(user?.barangayId ?? "");
}
