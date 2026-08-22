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

/**
 * The barangay a management request should operate on. A SUPER_ADMIN may target
 * any barangay by passing its id (used by the barangay switcher); every other
 * admin is locked to their own barangay.
 */
export function resolveScopeBarangayId(
  user: { role?: unknown; barangayId?: string | null } | null | undefined,
  requestedBarangayId?: string | null
): string {
  if (isSuperAdmin(user) && requestedBarangayId) {
    return String(requestedBarangayId);
  }
  return String(user?.barangayId ?? "");
}
