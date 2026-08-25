
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
  by: string;
  at: string;
};

export type ConditionDiagnosis = {
  by: string;
  at: string;
  barangayName?: string | null;
};

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
