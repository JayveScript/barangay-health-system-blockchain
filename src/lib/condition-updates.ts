// Helpers for showing WHO last changed a resident's medical-record status and
// WHEN. Medical conditions are flipped from "No" to "Yes" by a Diagnosis (see
// /api/diagnose). Each Diagnosis records the condition field keys it set, the
// staff member who recorded it (diagnosedBy), and the timestamp. By scanning a
// resident's diagnoses we can attribute each positive condition to the most
// recent diagnosis that set it.

export const CONDITION_FIELD_LABELS: Record<string, string> = {
  hasHypertension: "Hypertension",
  hasDiabetes: "Diabetes",
  hasStiHiv: "STI / HIV",
  hasHeartDisease: "Heart Disease",
  hasKidneyFailure: "Kidney Failure",
  hasTuberculosis: "Tuberculosis",
  hasAllergies: "Allergies",
  hasCancer: "Cancer",
  hasOtherConditions: "Other Conditions",
};

export type DiagnosisLike = {
  conditions?: string[] | null;
  createdAt: string | Date;
  diagnosedBy?: {
    fullName?: string | null;
    barangay?: { name?: string | null } | null;
  } | null;
};

export type ConditionUpdate = {
  by: string; // staff/doctor full name
  at: string; // ISO timestamp
};

export type ConditionDiagnosis = {
  by: string; // doctor / staff full name
  at: string; // ISO timestamp
  barangayName?: string | null; // barangay the diagnoser is assigned to
};

// Maps each condition field key -> the latest diagnosis that recorded it.
export function buildConditionUpdates(
  diagnoses: DiagnosisLike[] | null | undefined
): Record<string, ConditionUpdate> {
  const updates: Record<string, ConditionUpdate> = {};
  if (!Array.isArray(diagnoses)) return updates;

  for (const diagnosis of diagnoses) {
    const at = new Date(diagnosis.createdAt).toISOString();
    const by = diagnosis.diagnosedBy?.fullName?.trim() || "Health Worker";

    for (const key of diagnosis.conditions || []) {
      const existing = updates[key];
      if (!existing || new Date(at).getTime() > new Date(existing.at).getTime()) {
        updates[key] = { by, at };
      }
    }
  }

  return updates;
}

// Maps each condition field key -> the FULL list of diagnoses that recorded it,
// newest first. Used to show every doctor (and date) who diagnosed a condition,
// since diagnoses are append-only — a new doctor adds a record rather than
// editing an existing one.
export function buildConditionHistory(
  diagnoses: DiagnosisLike[] | null | undefined
): Record<string, ConditionDiagnosis[]> {
  const history: Record<string, ConditionDiagnosis[]> = {};
  if (!Array.isArray(diagnoses)) return history;

  for (const diagnosis of diagnoses) {
    const at = new Date(diagnosis.createdAt).toISOString();
    const by = diagnosis.diagnosedBy?.fullName?.trim() || "Health Worker";
    const barangayName = diagnosis.diagnosedBy?.barangay?.name ?? null;

    for (const key of diagnosis.conditions || []) {
      if (!history[key]) history[key] = [];
      history[key].push({ by, at, barangayName });
    }
  }

  for (const key of Object.keys(history)) {
    history[key].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );
  }

  return history;
}

export function formatUpdateDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
