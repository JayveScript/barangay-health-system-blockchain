"use client";

import { useState } from "react";
import { CheckCircle2, Stethoscope } from "lucide-react";

export const ASSESSMENT_CONDITIONS: { key: string; label: string; detailField?: string }[] = [
  { key: "hasHypertension", label: "Hypertension" },
  { key: "hasDiabetes", label: "Diabetes" },
  { key: "hasStiHiv", label: "STI / HIV" },
  { key: "hasHeartDisease", label: "Heart Disease" },
  { key: "hasKidneyFailure", label: "Kidney Failure" },
  { key: "hasTuberculosis", label: "Tuberculosis" },
  { key: "hasAllergies", label: "Allergies", detailField: "allergiesDetails" },
  { key: "hasCancer", label: "Cancer", detailField: "cancerDetails" },
  { key: "hasOtherConditions", label: "Other Conditions", detailField: "otherConditionsDetails" },
];

export function AssessmentForm({
  residentId,
  referralId,
  onSaved,
}: {
  residentId: string;
  referralId?: string;
  onSaved: () => void;
}) {
  const [isHealthy, setIsHealthy] = useState(false);
  const [conditions, setConditions] = useState<string[]>([]);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [medicalAdvice, setMedicalAdvice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reset = () => {
    setIsHealthy(false);
    setConditions([]);
    setDetails({});
    setNotes("");
    setMedicalAdvice("");
  };

  const setHealthy = (v: boolean) => {
    setError("");
    setSuccess("");
    setIsHealthy(v);
    if (v) {
      setConditions([]);
      setDetails({});
    }
  };

  const toggleCondition = (key: string) => {
    setError("");
    setSuccess("");
    setIsHealthy(false);
    setConditions((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const submit = async () => {
    setError("");
    setSuccess("");
    if (!isHealthy && conditions.length === 0 && !notes.trim() && !medicalAdvice.trim()) {
      setError("Select a finding, mark the resident healthy, or add notes / medical advice.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId,
          ...(referralId ? { referralId } : {}),
          isHealthy,
          conditions: isHealthy ? [] : conditions,
          details,
          notes: notes.trim(),
          medicalAdvice: medicalAdvice.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to save assessment.");
        return;
      }
      setSuccess("Assessment saved to the resident's record.");
      reset();
      onSaved();
    } catch (err) {
      console.error("ASSESSMENT_SAVE_ERROR", err);
      setError("Unable to save the assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
      <h4 className="mb-3 rounded-lg bg-[#0EA5E9] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
        New Assessment
      </h4>

      <label
        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-bold transition ${
          isHealthy ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-sky-200 bg-white text-slate-700 hover:bg-sky-50"
        }`}
      >
        <input
          type="checkbox"
          checked={isHealthy}
          onChange={(e) => setHealthy(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
        />
        Healthy / No findings
        <CheckCircle2 className={`ml-auto h-5 w-5 ${isHealthy ? "text-emerald-500" : "text-slate-300"}`} />
      </label>

      {!isHealthy && (
        <div className="mt-3">
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Findings</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ASSESSMENT_CONDITIONS.map((c) => {
              const active = conditions.includes(c.key);
              return (
                <div key={c.key}>
                  <button
                    type="button"
                    onClick={() => toggleCondition(c.key)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition ${
                      active ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${active ? "border-rose-400 bg-rose-500 text-white" : "border-slate-300"}`}>
                      {active && <CheckCircle2 className="h-3 w-3" />}
                    </span>
                    {c.label}
                  </button>
                  {active && c.detailField && (
                    <input
                      type="text"
                      value={details[c.detailField] ?? ""}
                      onChange={(e) => setDetails((prev) => ({ ...prev, [c.detailField!]: e.target.value }))}
                      placeholder={`${c.label} details`}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-sky-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-3">
        <p className="mb-1.5 text-xs font-black uppercase tracking-wide text-slate-500">Notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Assessment notes / observations"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-sky-500"
        />
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-xs font-black uppercase tracking-wide text-slate-500">Medical Advice</p>
        <textarea
          value={medicalAdvice}
          onChange={(e) => setMedicalAdvice(e.target.value)}
          rows={3}
          placeholder="Advice / recommendations for the resident"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-sky-500"
        />
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>
      )}
      {success && (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{success}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0EA5E9] px-5 py-3 text-sm font-black text-white shadow-md shadow-sky-500/20 transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Stethoscope className="h-4 w-4" />
        {submitting ? "Saving Assessment..." : "Save Assessment"}
      </button>
    </div>
  );
}
