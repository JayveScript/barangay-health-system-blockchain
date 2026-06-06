"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  HeartPulse,
  Plus,
  RefreshCw,
  Scale,
  Search,
  TrendingUp,
  User,
} from "lucide-react";

type Resident = {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  age?: number | null;
  sex?: string | null;
};

type BMIRecord = {
  id: string;
  residentId: string;
  height: number;
  weight: number;
  bmi: number;
  bmiCategory: string;
  pulseRate: number;
  createdAt: string;
  resident?: { firstName: string; lastName: string };
  recordedBy?: { fullName?: string | null };
};

function calcBMI(weight: number, height: number) {
  if (!weight || !height) return 0;
  const h = height / 100;
  return weight / (h * h);
}

function getBMICategory(bmi: number) {
  if (bmi <= 0) return { label: "—", color: "text-slate-400", bg: "bg-slate-50 border-slate-200" };
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" };
  if (bmi < 25) return { label: "Normal", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
  if (bmi < 30) return { label: "Overweight", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
  if (bmi < 35) return { label: "Obese Class I", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" };
  if (bmi < 40) return { label: "Obese Class II", color: "text-red-600", bg: "bg-red-50 border-red-200" };
  return { label: "Obese Class III", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" };
}

function getPulseStatus(pulse: number) {
  if (pulse <= 0) return { label: "—", color: "text-slate-400" };
  if (pulse < 60) return { label: "Bradycardia", color: "text-blue-600" };
  if (pulse <= 100) return { label: "Normal", color: "text-emerald-600" };
  return { label: "Tachycardia", color: "text-red-600" };
}

export function BMITab() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [records, setRecords] = useState<BMIRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [residentSearch, setResidentSearch] = useState("");
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [form, setForm] = useState({ height: "", weight: "", pulseRate: "" });

  const previewBMI = calcBMI(Number(form.weight), Number(form.height));
  const previewCategory = getBMICategory(previewBMI);

  const filteredResidents = residents.filter((r) => {
    const full = `${r.firstName} ${r.middleName ?? ""} ${r.lastName}`.toLowerCase();
    return full.includes(residentSearch.toLowerCase());
  });

  const loadResidents = async () => {
    try {
      const res = await fetch("/api/bmi/residents");
      const json = await res.json();
      if (res.ok) setResidents(Array.isArray(json) ? json : []);
    } catch {
      /* silent */
    }
  };

  const loadRecords = async (residentId?: string) => {
    try {
      setLoading(true);
      const url = residentId ? `/api/bmi?residentId=${residentId}` : "/api/bmi";
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) setRecords(Array.isArray(json) ? json : []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResidents();
    loadRecords();
  }, []);

  const submitBMI = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedResident) { setError("Please select a resident."); return; }
    if (!form.height || !form.weight || !form.pulseRate) {
      setError("Height, weight, and pulse rate are required.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/bmi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId: selectedResident.id,
          height: Number(form.height),
          weight: Number(form.weight),
          pulseRate: Number(form.pulseRate),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Failed to save BMI."); return; }
      setSuccess(`BMI recorded for ${selectedResident.firstName} ${selectedResident.lastName}.`);
      setForm({ height: "", weight: "", pulseRate: "" });
      await loadRecords(selectedResident.id);
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-4">
      {/* Input Panel */}
      <div className="rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Record BMI & Vitals</h3>
            <p className="text-sm text-slate-500">Select a registered resident and enter their measurements.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>
        )}

        <form onSubmit={submitBMI} className="space-y-5">
          {/* Resident search */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Select Resident *
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search resident by name..."
                value={selectedResident
                  ? `${selectedResident.firstName} ${selectedResident.lastName}`
                  : residentSearch}
                onChange={(e) => {
                  setSelectedResident(null);
                  setResidentSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-sky-50 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
              />
              {showDropdown && !selectedResident && filteredResidents.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-sky-200 bg-white shadow-xl">
                  {filteredResidents.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedResident(r);
                        setResidentSearch("");
                        setShowDropdown(false);
                        loadRecords(r.id);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-sky-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {r.firstName} {r.middleName ? r.middleName + " " : ""}{r.lastName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {r.age ? `${r.age} yrs` : ""}{r.sex ? ` · ${r.sex}` : ""}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showDropdown && !selectedResident && residentSearch && filteredResidents.length === 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-xl">
                  No resident found.
                </div>
              )}
            </div>
            {selectedResident && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 ring-1 ring-sky-200">
                <User className="h-4 w-4" />
                {selectedResident.firstName} {selectedResident.lastName}
                {selectedResident.age ? ` · ${selectedResident.age} yrs` : ""}
                {selectedResident.sex ? ` · ${selectedResident.sex}` : ""}
                <button
                  type="button"
                  onClick={() => { setSelectedResident(null); setResidentSearch(""); loadRecords(); }}
                  className="ml-1 text-sky-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Measurements grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <MeasurementInput
              label="Height (cm)"
              icon={<TrendingUp className="h-4 w-4" />}
              placeholder="e.g. 165"
              value={form.height}
              onChange={(v) => setForm((f) => ({ ...f, height: v }))}
              hint="Normal: 100 – 250 cm"
            />
            <MeasurementInput
              label="Weight (kg)"
              icon={<Scale className="h-4 w-4" />}
              placeholder="e.g. 60"
              value={form.weight}
              onChange={(v) => setForm((f) => ({ ...f, weight: v }))}
              hint="Normal: 1 – 300 kg"
            />
            <MeasurementInput
              label="Pulse Rate (bpm)"
              icon={<HeartPulse className="h-4 w-4" />}
              placeholder="e.g. 72"
              value={form.pulseRate}
              onChange={(v) => setForm((f) => ({ ...f, pulseRate: v }))}
              hint="Normal: 60 – 100 bpm"
            />
          </div>

          {/* Live BMI Preview */}
          {previewBMI > 0 && (
            <div className={`rounded-2xl border p-4 ${previewCategory.bg}`}>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Live BMI Preview</p>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-4xl font-black text-slate-900">{previewBMI.toFixed(1)}</span>
                <div>
                  <span className={`text-lg font-black ${previewCategory.color}`}>{previewCategory.label}</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Underweight &lt;18.5 · Normal 18.5–24.9 · Overweight 25–29.9 · Obese ≥30
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-[#0EA5E9] px-6 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {submitting ? "Saving..." : "Save BMI Record"}
          </button>
        </form>
      </div>

      {/* BMI Reference Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Underweight", range: "< 18.5", color: "bg-blue-50 border-blue-200 text-blue-700" },
          { label: "Normal", range: "18.5 – 24.9", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          { label: "Overweight", range: "25 – 29.9", color: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Obese I", range: "30 – 34.9", color: "bg-orange-50 border-orange-200 text-orange-700" },
          { label: "Obese II", range: "35 – 39.9", color: "bg-red-50 border-red-200 text-red-700" },
          { label: "Obese III", range: "≥ 40", color: "bg-rose-50 border-rose-200 text-rose-700" },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl border p-3 text-center ${item.color}`}>
            <p className="text-xs font-black uppercase">{item.label}</p>
            <p className="mt-1 text-sm font-bold">{item.range}</p>
          </div>
        ))}
      </div>

      {/* Records Table */}
      <div className="rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {selectedResident
                  ? `BMI History — ${selectedResident.firstName} ${selectedResident.lastName}`
                  : "All BMI Records"}
              </h3>
              <p className="text-xs text-slate-500">{records.length} record{records.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadRecords(selectedResident?.id)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-600 hover:bg-sky-100 disabled:opacity-60"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm font-semibold text-slate-500">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-sky-200 bg-sky-50/50 py-10 text-center">
            <Scale className="mx-auto mb-3 h-10 w-10 text-sky-300" />
            <p className="text-sm font-bold text-slate-500">No BMI records yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sky-100 bg-sky-50">
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Resident</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Height</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Weight</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">BMI</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Category</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Pulse</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {records.map((r) => {
                  const cat = getBMICategory(r.bmi);
                  const pulse = getPulseStatus(r.pulseRate);
                  const dt = new Date(r.createdAt);
                  return (
                    <tr key={r.id} className="transition hover:bg-sky-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {r.resident
                          ? `${r.resident.firstName} ${r.resident.lastName}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{r.height} cm</td>
                      <td className="px-4 py-3 text-slate-700">{r.weight} kg</td>
                      <td className="px-4 py-3 text-xl font-black text-slate-900">{r.bmi.toFixed(1)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-xl border px-3 py-1 text-xs font-bold ${cat.bg} ${cat.color}`}>
                          {r.bmiCategory}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${pulse.color}`}>{r.pulseRate} bpm</span>
                        <span className="ml-1.5 text-xs text-slate-400">({pulse.label})</span>
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
    </div>
  );
}

function MeasurementInput({
  label,
  icon,
  placeholder,
  value,
  onChange,
  hint,
}: {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400">{icon}</span>
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-sky-50 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
        />
      </div>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
