const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  BARANGAY_ADMIN: "Barangay Admin",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  BHW: "BHW",
  MIDWIFE: "Midwife",
  STAFF: "Staff",
  RESIDENT: "Resident",
};

export function formatRoleLabel(role: string): string {
  return ROLE_LABELS[role.toUpperCase()] ?? role;
}

export function formatWelcomeLine(role: string, fullName: string | null | undefined): string {
  const label = formatRoleLabel(role);
  const name = fullName?.trim() || "Authorized User";
  return `${label} – ${name}`;
}

export const HIGH_PRIVILEGE_ROLES = new Set(["SUPER_ADMIN", "BARANGAY_ADMIN"]);
