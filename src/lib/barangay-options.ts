export const DEFAULT_BARANGAY_CITY = "Davao City";

export const REGISTRATION_BARANGAY_OPTIONS = [
  { label: "PANAGA, BRGY. COLOSAS", value: "Panaga, Brgy. Colosas" },
  { label: "COLOSAS PROPER, BRGY. COLOSAS", value: "Colosas Proper, Brgy. Colosas" },
  { label: "SURAYAN, BRGY. COLOSAS", value: "Surayan, Brgy. Colosas" },
  { label: "MONTEFLOR, BRGY. COLOSAS", value: "Monteflor, Brgy. Colosas" },
  { label: "GALACIA, BRGY. COLOSAS", value: "Galacia, Brgy. Colosas" },
  { label: "APALILI, BRGY. COLOSAS", value: "Apalili, Brgy. Colosas" },
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
