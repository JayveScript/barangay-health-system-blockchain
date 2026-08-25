export const DEFAULT_BARANGAY_CITY = "Davao City";

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

export const REGISTRATION_SITIO_OPTIONS = HEALTH_CENTERS.flatMap((hc) =>
  hc.sitios.map((sitio) => ({ label: sitio, value: sitio }))
);

export const REGISTRATION_BARANGAY_OPTIONS = REGISTRATION_SITIO_OPTIONS;

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

export const REFERRAL_RECEIVING_BARANGAY_NAMES: string[] = HEALTH_CENTER_NAMES;

export type RegistrationSitioName =
  (typeof REGISTRATION_SITIO_OPTIONS)[number]["value"];
