"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  RefreshCw,
  Save,
  Search,
  Stethoscope,
  User,
  Users,
} from "lucide-react";

type MedicalHistory = {
  hasHypertension: boolean;
  hasDiabetes: boolean;
  hasStiHiv: boolean;
  hasHeartDisease: boolean;
  hasKidneyFailure: boolean;
  hasTuberculosis: boolean;
  hasAllergies: boolean;
  allergiesDetails?: string | null;
  hasCancer: boolean;
  cancerDetails?: string | null;
  hasOtherConditions: boolean;
  otherConditionsDetails?: string | null;
} | null;

type ResidentLite = {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  age?: number | null;
  sex?: string | null;
  medicalHistory?: MedicalHistory;
};

type DiagnoseAppointment = {
  id: string;
  date: string;
  time: string;
  reason: string;
  otherReason?: string | null;
  status: string;
  doctorName?: string | null;
  diagnosedCount: number;
  resident: ResidentLite | null;
};

type DiagnosisRecord = {
  id: string;
  isHealthy: boolean;
  conditions: string[];
  notes?: string | null;
  createdAt: string;
  resident?: { firstName: string; lastName: string; middleName?: string | null } | null;
  diagnosedBy?: { fullName?: string | null; role?: string } | null;
  appointment?: { id: string; date: string; time: string } | null;
};

const CONDITION_OPTIONS: {
  key: keyof NonNullable<MedicalHistory>;
  label: string;
  detailField?: string;
  detailPlaceholder?: string;
}[] = [
  { key: "hasHypertension", label: "Hypertension" },
  { key: "hasDiabetes", label: "Diabetes" },
  { key: "hasStiHiv", label: "STI / HIV" },
  { key: "hasHeartDisease", label: "Heart Disease" },
  { key: "hasKidneyFailure", label: "Kidney Failure" },
  { key: "hasTuberculosis", label: "Tuberculosis" },
  {
    key: "hasAllergies",
    label: "Allergies",
    detailField: "allergiesDetails",
    detailPlaceholder: "e.g. Penicillin, peanuts, dust",
  },
  {
    key: "hasCancer",
    label: "Cancer",
    detailField: "cancerDetails",
    detailPlaceholder: "e.g. Breast cancer, Stage II",
  },
  {
    key: "hasOtherConditions",
    label: "Other Conditions",
    detailField: "otherConditionsDetails",
    detailPlaceholder: "Describe the condition",
  },
];

function fullName(p: { firstName: string; lastName: string; middleName?: string | null }) {
  return `${p.firstName} ${p.middleName ? p.middleName + " " : ""}${p.lastName}`
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h)) return value;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m ?? 0).padStart(2, "0")} ${period}`;
}

export function DiagnoseTab() {
  const [source, setSource] = useState<"appointment" | "resident">("appointment");

  const [appointments, setAppointments] = useState<DiagnoseAppointment[]>([]);
  const [residents, setResidents] = useState<ResidentLite[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisRecord[]>([]);

  const [selectedAppointment, setSelectedAppointment] = useState<DiagnoseAppointment | null>(null);
  const [selectedResident, setSelectedResident] = useState<ResidentLite | null>(null);
  const [residentSearch, setResidentSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [isHealthy, setIsHealthy] = useState(false);
  const [conditions, setConditions] = useState<string[]>([]);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const patient = source === "appointment" ? selectedAppointment?.resident ?? null : selectedResident;

  const filteredResidents = residents.filter((r) =>
    fullName(r).toLowerCase().includes(residentSearch.toLowerCase())
  );

  const loadAppointments = async () => {
    try {
      const res = await fetch("/api/diagnose/appointments");
      const json = await res.json();
      if (res.ok) setAppointments(Array.isArray(json) ? json : []);
    } catch {
      /* silent */
    }
  };

  const loadResidents = async () => {
    try {
      const res = await fetch("/api/diagnose/residents");
      const json = await res.json();
      if (res.ok) setResidents(Array.isArray(json) ? json : []);
    } catch {
      /* silent */
    }
  };

  const loadDiagnoses = async (residentId?: string) => {
    try {
      setLoading(true);
      const url = residentId ? `/api/diagnose?residentId=${residentId}` : "/api/diagnose";
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) setDiagnoses(Array.isArray(json) ? json : []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadResidents();
    loadDiagnoses();
  }, []);

  useEffect(() => {
    setIsHealthy(false);
    setConditions([]);
    setDetails({});
    setNotes("");
    setError("");
    setSuccess("");
    loadDiagnoses(patient?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  const toggleCondition = (key: string) => {
    setConditions((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  };

  const submitDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!patient) {
      setError("Please select a patient first.");
      return;
    }
    if (!isHealthy && conditions.length === 0 && !notes.trim()) {
      setError("Select at least one finding, mark the patient as healthy, or add notes.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId: patient.id,
          appointmentId: source === "appointment" ? selectedAppointment?.id : null,
          isHealthy,
          conditions,
          details,
          notes: notes.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to save diagnosis.");
        return;
      }
      setSuccess(`Diagnosis saved for ${fullName(patient)}. Their medical history has been updated.`);
      setIsHealthy(false);
      setConditions([]);
      setDetails({});
      setNotes("");
      await Promise.all([loadDiagnoses(patient.id), loadResidents(), loadAppointments()]);
      setTimeout(() => setSuccess(""), 5000);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-4">
      {/* Patient selection panel */}
      <div className="rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Diagnose Patient</h3>
            <p className="text-sm text-slate-500">
              Choose a patient from a completed appointment or your registered residents, then record your findings.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>
        )}

        {/* Source toggle */}
        <div className="mb-5 inline-flex w-full gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-1.5 sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setSource("appointment");
              setSelectedResident(null);
              setResidentSearch("");
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:flex-none ${
              source === "appointment" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-sky-600"
            }`}
          >
            <CalendarCheck className="h-4 w-4" />
            From Appointment Bookings
          </button>
          <button
            type="button"
            onClick={() => {
              setSource("resident");
              setSelectedAppointment(null);
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:flex-none ${
              source === "resident" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-sky-600"
            }`}
          >
            <Users className="h-4 w-4" />
            From Registered Residents
          </button>
        </div>

        {source === "appointment" ? (
          <AppointmentPicker
            appointments={appointments}
            selected={selectedAppointment}
            onSelect={setSelectedAppointment}
          />
        ) : (
          <ResidentPicker
            residents={filteredResidents}
            search={residentSearch}
            setSearch={setResidentSearch}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
            selected={selectedResident}
            onSelect={setSelectedResident}
          />
        )}
      </div>

      {/* Diagnosis form */}
      {patient && (
        <div className="rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm">
          <PatientSummary
            patient={patient}
            appointment={source === "appointment" ? selectedAppointment : null}
          />

          <form onSubmit={submitDiagnosis} className="mt-5 space-y-5">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                isHealthy ? "border-emerald-300 bg-emerald-50" : "border-sky-200 bg-white hover:bg-sky-50"
              }`}
            >
              <input
                type="checkbox"
                checked={isHealthy}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsHealthy(checked);
                  if (checked) {
                    setConditions([]);
                    setDetails({});
                  }
                }}
                className="h-5 w-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <p className={`text-sm font-black ${isHealthy ? "text-emerald-700" : "text-slate-700"}`}>
                  Healthy Patient / No Findings
                </p>
                <p className="text-xs text-slate-500">
                  Check this if the patient shows no medical concerns after examination.
                </p>
              </div>
              <CheckCircle2 className={`ml-auto h-6 w-6 shrink-0 ${isHealthy ? "text-emerald-500" : "text-slate-300"}`} />
            </label>

            {!isHealthy && (
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                  Findings — Select all conditions that apply
                </label>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {CONDITION_OPTIONS.map((opt) => (
                    <DiagnosisConditionField
                      key={opt.key}
                      option={opt}
                      checked={conditions.includes(opt.key)}
                      onToggle={() => toggleCondition(opt.key)}
                      detailValue={opt.detailField ? details[opt.detailField] ?? "" : ""}
                      onDetailChange={(value) =>
                        opt.detailField && setDetails((d) => ({ ...d, [opt.detailField as string]: value }))
                      }
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Conditions checked here will update this patient&apos;s medical history from &quot;No&quot; to &quot;Yes&quot;.
                </p>
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                Doctor&apos;s Notes / Additional Findings
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Example: Mild upper respiratory infection. Prescribed amoxicillin 500mg, 3x a day for 7 days. Advised rest, fluids, and follow-up after one week."
                className="min-h-[140px] w-full resize-none rounded-2xl border border-sky-200 bg-sky-50/40 px-4 py-4 text-sm font-semibold leading-7 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-[#0EA5E9] px-6 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {submitting ? "Saving Diagnosis..." : "Save Diagnosis"}
            </button>
          </form>
        </div>
      )}

      {/* History */}
      <DiagnosisHistory
        diagnoses={diagnoses}
        loading={loading}
        patient={patient}
        onRefresh={() => loadDiagnoses(patient?.id)}
      />
    </div>
  );
}

function AppointmentPicker({
  appointments,
  selected,
  onSelect,
}: {
  appointments: DiagnoseAppointment[];
  selected: DiagnoseAppointment | null;
  onSelect: (appointment: DiagnoseAppointment) => void;
}) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-sky-200 bg-sky-50/50 py-10 text-center">
        <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-sky-300" />
        <p className="text-sm font-bold text-slate-500">No completed appointments yet.</p>
        <p className="mt-1 text-xs text-slate-400">Accepted appointments will appear here for diagnosis.</p>
      </div>
    );
  }

  return (
    <div className="grid max-h-[440px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
      {appointments.map((appt) => {
        const isSelected = selected?.id === appt.id;
        const r = appt.resident;
        return (
          <button
            key={appt.id}
            type="button"
            onClick={() => onSelect(appt)}
            className={`flex flex-col gap-2 rounded-2xl border p-4 text-left transition ${
              isSelected ? "border-sky-400 bg-sky-50 ring-2 ring-sky-200" : "border-sky-200 bg-white hover:bg-sky-50"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-slate-900">
                <User className="h-4 w-4 shrink-0 text-sky-500" />
                <span className="truncate">{r ? fullName(r) : "Unknown Resident"}</span>
              </span>
              {appt.diagnosedCount > 0 && (
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-600">
                  Diagnosed
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> {formatDate(appt.date)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatTime(appt.time)}
              </span>
            </div>
            <p className="truncate text-xs font-semibold text-slate-600">
              {appt.reason === "Others" ? appt.otherReason || "Others" : appt.reason}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function ResidentPicker({
  residents,
  search,
  setSearch,
  showDropdown,
  setShowDropdown,
  selected,
  onSelect,
}: {
  residents: ResidentLite[];
  search: string;
  setSearch: (value: string) => void;
  showDropdown: boolean;
  setShowDropdown: (value: boolean) => void;
  selected: ResidentLite | null;
  onSelect: (resident: ResidentLite | null) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        Select Registered Resident *
      </label>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search resident by name..."
          value={selected ? fullName(selected) : search}
          onChange={(e) => {
            onSelect(null);
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-sky-50 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
        />
        {showDropdown && !selected && residents.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-sky-200 bg-white shadow-xl">
            {residents.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onSelect(r);
                  setSearch("");
                  setShowDropdown(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-sky-50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{fullName(r)}</p>
                  <p className="text-xs text-slate-500">
                    {r.age ? `${r.age} yrs` : ""}
                    {r.sex ? ` · ${r.sex}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
        {showDropdown && !selected && search && residents.length === 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-xl">
            No resident found.
          </div>
        )}
      </div>
      {selected && (
        <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 ring-1 ring-sky-200">
          <User className="h-4 w-4" />
          {fullName(selected)}
          {selected.age ? ` · ${selected.age} yrs` : ""}
          {selected.sex ? ` · ${selected.sex}` : ""}
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setSearch("");
            }}
            className="ml-1 text-sky-400 hover:text-red-500"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function PatientSummary({
  patient,
  appointment,
}: {
  patient: ResidentLite;
  appointment?: DiagnoseAppointment | null;
}) {
  const history = patient.medicalHistory;
  const knownConditions = CONDITION_OPTIONS.filter((opt) => history?.[opt.key]);

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-600 ring-1 ring-sky-200">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-black text-slate-900">{fullName(patient)}</p>
            <p className="text-xs font-semibold text-slate-500">
              {patient.age ? `${patient.age} yrs` : ""}
              {patient.sex ? ` · ${patient.sex}` : ""}
            </p>
          </div>
        </div>
        {appointment && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
            <CalendarCheck className="h-3.5 w-3.5 text-sky-500" />
            {formatDate(appointment.date)} · {formatTime(appointment.time)}
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-400">Existing Medical History</p>
        {knownConditions.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {knownConditions.map((c) => (
              <span
                key={c.key}
                className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200"
              >
                {c.label}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-xs font-semibold text-slate-400">No recorded conditions yet.</p>
        )}
      </div>
    </div>
  );
}

function DiagnosisConditionField({
  option,
  checked,
  onToggle,
  detailValue,
  onDetailChange,
}: {
  option: (typeof CONDITION_OPTIONS)[number];
  checked: boolean;
  onToggle: () => void;
  detailValue: string;
  onDetailChange: (value: string) => void;
}) {
  if (option.detailField) {
    return (
      <div
        className={`rounded-2xl border p-4 transition ${
          checked ? "border-sky-300 bg-sky-50" : "border-sky-200 bg-white"
        }`}
      >
        <label className="mb-3 flex items-center gap-3 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
          />
          {option.label}
        </label>
        <input
          type="text"
          value={detailValue}
          onChange={(e) => onDetailChange(e.target.value)}
          placeholder={option.detailPlaceholder}
          disabled={!checked}
          className="w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </div>
    );
  }

  return (
    <label
      className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition ${
        checked ? "border-sky-300 bg-sky-50 text-sky-700" : "border-sky-200 bg-white text-slate-700 hover:bg-sky-50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
      />
      {option.label}
    </label>
  );
}

function DiagnosisHistory({
  diagnoses,
  loading,
  patient,
  onRefresh,
}: {
  diagnoses: DiagnosisRecord[];
  loading: boolean;
  patient: ResidentLite | null;
  onRefresh: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {patient ? `Diagnosis History — ${fullName(patient)}` : "Recent Diagnoses"}
            </h3>
            <p className="text-xs text-slate-500">
              {diagnoses.length} record{diagnoses.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-600 hover:bg-sky-100 disabled:opacity-60"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm font-semibold text-slate-500">Loading records...</div>
      ) : diagnoses.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-sky-200 bg-sky-50/50 py-10 text-center">
          <Stethoscope className="mx-auto mb-3 h-10 w-10 text-sky-300" />
          <p className="text-sm font-bold text-slate-500">No diagnoses recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50">
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Patient</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Findings</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Notes</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Diagnosed By</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-50">
              {diagnoses.map((d) => {
                const dt = new Date(d.createdAt);
                return (
                  <tr key={d.id} className="transition hover:bg-sky-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {d.resident ? fullName(d.resident) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {d.isHealthy ? (
                        <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Healthy / No Findings
                        </span>
                      ) : d.conditions.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {d.conditions.map((key) => {
                            const opt = CONDITION_OPTIONS.find((c) => c.key === key);
                            return (
                              <span
                                key={key}
                                className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200"
                              >
                                {opt?.label || key}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">—</span>
                      )}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-slate-600">
                      {d.notes ? <p className="line-clamp-2">{d.notes}</p> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                      {d.diagnosedBy?.fullName || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                      <span className="ml-1.5 text-slate-400">
                        {dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
