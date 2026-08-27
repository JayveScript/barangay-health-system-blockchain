import type { RecordType } from "@/lib/blockchain";

// Canonical shapes for the resident records that get sealed on-chain. Both the
// anchoring step (at registration) and the verification step build the record
// objects with THIS function, reading the same database row — so an untampered
// record always hashes identically and only a real edit shows as "changed".

type HistoryLike = Record<string, unknown> | null | undefined;

export type ResidentWithHistories = {
  lastName: string | null;
  firstName: string | null;
  middleName: string | null;
  age: number | null;
  sex: string | null;
  birthDate: Date | string | null;
  civilStatus: string | null;
  completeAddress: string | null;
  barangayName: string | null;
  city: string | null;
  medicalHistory?: HistoryLike;
  familyHistory?: HistoryLike;
  personalSocialHistory?: HistoryLike;
};

export const RESIDENT_RECORD_LABELS: Record<string, string> = {
  resident_profile: "Identity / Profile",
  medical_history: "Medical History",
  family_history: "Family History",
  personal_social: "Personal / Social History",
};

export const RESIDENT_RECORD_ORDER: RecordType[] = [
  "resident_profile",
  "medical_history",
  "family_history",
  "personal_social",
];

function pickBool(h: HistoryLike, key: string): boolean {
  return Boolean(h && (h as Record<string, unknown>)[key]);
}

function pickStr(h: HistoryLike, key: string): string | null {
  const v = h && (h as Record<string, unknown>)[key];
  return v === undefined || v === null ? null : String(v);
}

export function buildResidentRecords(
  r: ResidentWithHistories
): Record<string, Record<string, unknown> | null> {
  const mh = r.medicalHistory;
  const fh = r.familyHistory;
  const ph = r.personalSocialHistory;

  return {
    resident_profile: {
      lastName: r.lastName,
      firstName: r.firstName,
      middleName: r.middleName,
      age: r.age,
      sex: r.sex,
      birthDate: r.birthDate,
      civilStatus: r.civilStatus,
      completeAddress: r.completeAddress,
      barangayName: r.barangayName,
      city: r.city,
    },
    medical_history: mh
      ? {
          hasHypertension: pickBool(mh, "hasHypertension"),
          hasDiabetes: pickBool(mh, "hasDiabetes"),
          hasStiHiv: pickBool(mh, "hasStiHiv"),
          hasHeartDisease: pickBool(mh, "hasHeartDisease"),
          hasKidneyFailure: pickBool(mh, "hasKidneyFailure"),
          hasTuberculosis: pickBool(mh, "hasTuberculosis"),
          hasAllergies: pickBool(mh, "hasAllergies"),
          allergiesDetails: pickStr(mh, "allergiesDetails"),
          hasCancer: pickBool(mh, "hasCancer"),
          cancerDetails: pickStr(mh, "cancerDetails"),
          hasOtherConditions: pickBool(mh, "hasOtherConditions"),
          otherConditionsDetails: pickStr(mh, "otherConditionsDetails"),
          maintenanceMedications: pickStr(mh, "maintenanceMedications"),
          previousIllnessesSurgeries: pickStr(mh, "previousIllnessesSurgeries"),
        }
      : null,
    family_history: fh
      ? {
          asthmaAllergies: pickBool(fh, "asthmaAllergies"),
          birthDefects: pickBool(fh, "birthDefects"),
          cancer: pickBool(fh, "cancer"),
          dementia: pickBool(fh, "dementia"),
          diabetes: pickBool(fh, "diabetes"),
          hypertension: pickBool(fh, "hypertension"),
          kidneyDisease: pickBool(fh, "kidneyDisease"),
          mentalIllness: pickBool(fh, "mentalIllness"),
        }
      : null,
    personal_social: ph
      ? {
          eatsHealthyDiet: pickBool(ph, "eatsHealthyDiet"),
          adequatePhysicalActivity: pickBool(ph, "adequatePhysicalActivity"),
          sufficientRestSleep: pickBool(ph, "sufficientRestSleep"),
          normalGrowthDevelopment: pickBool(ph, "normalGrowthDevelopment"),
          multipleSexPartners: pickBool(ph, "multipleSexPartners"),
          smokesTobacco: pickBool(ph, "smokesTobacco"),
          tobaccoPacksPerYear: pickStr(ph, "tobaccoPacksPerYear"),
          drinksAlcohol: pickBool(ph, "drinksAlcohol"),
          alcoholBottlesPerDay: pickStr(ph, "alcoholBottlesPerDay"),
          takesIllicitDrugs: pickBool(ph, "takesIllicitDrugs"),
          illicitDrugsDetails: pickStr(ph, "illicitDrugsDetails"),
        }
      : null,
  };
}
