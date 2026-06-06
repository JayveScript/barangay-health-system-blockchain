export const DEFAULT_BARANGAY_CITY = "Davao City";

export const REGISTRATION_BARANGAY_OPTIONS = [
  { label: "BARANGAY 19-B", value: "Barangay 19-B" },
  { label: "BARANGAY 20", value: "Barangay 20" },
] as const;

export const REFERRAL_RECEIVING_BARANGAY_NAMES: string[] =
  REGISTRATION_BARANGAY_OPTIONS.map((barangay) => barangay.value);

export type RegistrationBarangayName =
  (typeof REGISTRATION_BARANGAY_OPTIONS)[number]["value"];

export function getRegistrationBarangay(value: string) {
  const normalized = value.trim().toLowerCase();

  return REGISTRATION_BARANGAY_OPTIONS.find(
    (barangay) =>
      barangay.value.toLowerCase() === normalized ||
      barangay.label.toLowerCase() === normalized
  );
}
