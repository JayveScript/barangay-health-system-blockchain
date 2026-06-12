"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { CalendarCheck, MapPin, Stethoscope, X } from "lucide-react";
import {
  buildConditionHistory,
  formatUpdateDate,
  type ConditionDiagnosis,
  type DiagnosisLike,
} from "@/lib/condition-updates";

type MedicalFlags = {
  hasHypertension?: boolean | null;
  hasDiabetes?: boolean | null;
  hasStiHiv?: boolean | null;
  hasHeartDisease?: boolean | null;
  hasKidneyFailure?: boolean | null;
  hasTuberculosis?: boolean | null;
  hasAllergies?: boolean | null;
  hasCancer?: boolean | null;
  hasOtherConditions?: boolean | null;
} | null;

const CONDITIONS: { label: string; field: keyof NonNullable<MedicalFlags> }[] = [
  { label: "Hypertension", field: "hasHypertension" },
  { label: "Diabetes", field: "hasDiabetes" },
  { label: "STI / HIV", field: "hasStiHiv" },
  { label: "Heart Disease", field: "hasHeartDisease" },
  { label: "Kidney Failure", field: "hasKidneyFailure" },
  { label: "Tuberculosis", field: "hasTuberculosis" },
  { label: "Allergies", field: "hasAllergies" },
  { label: "Cancer", field: "hasCancer" },
  { label: "Other Conditions", field: "hasOtherConditions" },
];

/**
 * Recorded-conditions grid where each "Yes" condition is clickable and opens a
 * modal listing every doctor who diagnosed it (with date + barangay). Shared by
 * the admin resident modal and the QR digital-ID view. Diagnoses are append-
 * only, so the modal shows the full history and notes that no doctor can edit
 * another doctor's entry.
 */
export function ConditionHistoryCard({
  medicalHistory,
  diagnoses,
  residentName,
}: {
  medicalHistory: MedicalFlags;
  diagnoses: DiagnosisLike[];
  residentName: string;
}) {
  const [active, setActive] = useState<{ label: string; field: string } | null>(
    null
  );

  const history = buildConditionHistory(diagnoses);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CONDITIONS.map((item) => {
          const value = medicalHistory?.[item.field] === true;
          const count = (history[item.field] || []).length;

          if (value) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() =>
                  setActive({ label: item.label, field: item.field })
                }
                className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-black text-red-700 transition hover:bg-red-100"
              >
                {item.label}
                <span className="mt-1 block text-[10px] font-bold text-red-500/80">
                  {count > 0
                    ? `${count} record${count > 1 ? "s" : ""} · tap to view`
                    : "tap to view"}
                </span>
              </button>
            );
          }

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-400"
            >
              {item.label}
            </div>
          );
        })}
      </div>

      {active && (
        <ConditionHistoryModal
          label={active.label}
          history={history[active.field] || []}
          selfReportedBy={residentName}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}

function ConditionHistoryModal({
  label,
  history,
  selfReportedBy,
  onClose,
}: {
  label: string;
  history: ConditionDiagnosis[];
  selfReportedBy: string;
  onClose: () => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
              <Stethoscope className="h-5 w-5 stroke-[2.6]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">{label}</h3>
              <p className="text-xs font-semibold text-slate-500">
                Diagnosis history
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {history.length === 0 ? (
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
              <p className="text-sm font-black text-slate-900">Self-reported</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {selfReportedBy} reported this condition during registration.
              </p>
            </div>
          ) : (
            history.map((entry, index) => (
              <div
                key={`${entry.by}-${entry.at}-${index}`}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-900">
                    Dr. {entry.by}
                  </p>
                  {index === 0 && history.length > 1 && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-600">
                      Latest
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    {formatUpdateDate(entry.at)}
                  </span>
                  {entry.barangayName && (
                    <span className="inline-flex items-center gap-1 text-sky-600">
                      <MapPin className="h-3.5 w-3.5" />
                      {entry.barangayName}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-[11px] font-semibold leading-relaxed text-slate-400">
          Each diagnosis is a permanent record. A doctor can add a new diagnosis
          but cannot edit or remove another doctor&apos;s entry.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}
