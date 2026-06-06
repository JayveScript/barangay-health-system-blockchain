export const BARANGAY_ADMIN_USERNAME_SUFFIX = "@barangay.hcms";
export const BARANGAY_ADMIN_USERNAME_PATTERN =
  "^[a-z0-9._-]+@barangay\\.hcms$";
export const BARANGAY_ADMIN_USERNAME_REGEX =
  new RegExp(BARANGAY_ADMIN_USERNAME_PATTERN, "i");

export function isValidBarangayAdminUsername(username: string) {
  return BARANGAY_ADMIN_USERNAME_REGEX.test(username.trim());
}

export function normalizeBarangayHcmsUsername(username: string) {
  const normalized = username.trim().toLowerCase();

  if (!normalized) return "";
  if (normalized.endsWith(BARANGAY_ADMIN_USERNAME_SUFFIX)) {
    return normalized;
  }
  if (normalized.includes("@")) {
    return normalized;
  }

  return `${normalized}${BARANGAY_ADMIN_USERNAME_SUFFIX}`;
}

export function getBarangayHcmsUsernameLocalPart(username: string) {
  const trimmed = username.trim();
  const lower = trimmed.toLowerCase();

  if (lower.endsWith(BARANGAY_ADMIN_USERNAME_SUFFIX)) {
    return trimmed.slice(0, -BARANGAY_ADMIN_USERNAME_SUFFIX.length);
  }

  return trimmed;
}
