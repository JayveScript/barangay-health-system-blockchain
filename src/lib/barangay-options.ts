export const DEFAULT_BARANGAY_CITY = "Davao City";

// Two health centers (tenants). Each covers one or more sitios. A resident's
// sitio (their address) determines which health center owns their records.
export const HEALTH_CENTERS = [
  {
    name: "PANAGA HEALTH CENTER",
    sitios: ["Panaga", "Galacia", "Monteflor", "Surayan", "Apalili"],
  },
  {
    name: "COLOSAS PROPER",
    sitios: ["Colosas Proper"],
  },
] as const;

export const HEALTH_CENTER_NAMES: string[] = HEALTH_CENTERS.map((h) => h.name);

// Sitio choices shown in registration (the resident's actual sitio/address).
export const REGISTRATION_SITIO_OPTIONS = HEALTH_CENTERS.flatMap((hc) =>
  hc.sitios.map((sitio) => ({ label: sitio, value: sitio }))
);

// Kept as an alias for existing imports (registration dropdown).
export const REGISTRATION_BARANGAY_OPTIONS = REGISTRATION_SITIO_OPTIONS;

// Which health center a sitio belongs to. Returns the health-center name or null.
export function getHealthCenterForSitio(sitio: string): string | null {
  const normalized = sitio.trim().toLowerCase();
  for (const hc of HEALTH_CENTERS) {
    if (hc.sitios.some((s) => s.toLowerCase() === normalized)) {
      return hc.name;
    }
  }
  return null;
}

export const EDUCATIONAL_ATTAINMENT_OPTIONS = [
  "Home",
  "Day Care",
  "Kindergarten",
  "Elementary Level",
  "Elementary Graduate",
  "JHS/SHS Level",
  "JHS/SHS Graduate",
  "College Level",
  "College Graduate",
] as const;

export const RELATIONSHIP_OPTIONS = [
  "Parent",
  "Grandparent",
  "Sibling",
  "Spouse",
  "Common-Law",
  "Relative",
  "Neighbor",
  "Others",
] as const;

// Health centers that may receive referrals (cross-center access is granted
// only when a resident is referred to the other center).
export const REFERRAL_RECEIVING_BARANGAY_NAMES: string[] = HEALTH_CENTER_NAMES;

export type RegistrationSitioName =
  (typeof REGISTRATION_SITIO_OPTIONS)[number]["value"];
