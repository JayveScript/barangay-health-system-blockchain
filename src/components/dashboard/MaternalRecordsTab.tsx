"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  Baby,
  CheckCircle2,
  ClipboardList,
  Eye,
  HeartPulse,
  Lock,
  Pencil,
  Save,
  Search,
  UserRound,
  X,
} from "lucide-react";

type PregnantResident = {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  age: number;
  contactNumber: string | null;
  sitio: string | null;
  hasRecord: boolean;
  updatedAt: string | null;
};

type FormData = Record<string, string>;

const fullName = (r: { firstName: string; middleName: string | null; lastName: string }) =>
  `${r.firstName} ${r.middleName ?? ""} ${r.lastName}`.replace(/\s+/g, " ").trim();

// Expected Date of Delivery = LMP + 280 days
function computeEdd(lmp: string): string {
  if (!lmp) return "";
  const d = new Date(lmp);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + 280);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Age of Gestation = (today - LMP) in weeks + days; live, based on current date
function computeGestation(lmp: string): string {
  if (!lmp) return "";
  const start = new Date(lmp);
  if (Number.isNaN(start.getTime())) return "";
  const today = new Date();
  const diffMs = today.getTime() - start.getTime();
  if (diffMs < 0) return "";
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return `${weeks} week${weeks === 1 ? "" : "s"} ${days} day${days === 1 ? "" : "s"}`;
}

// Age of Gestation at a specific visit = (Date of Visit - LMP) in weeks + days.
function gestationBetween(lmp: string | undefined, visitDate: string | undefined): string {
  if (!lmp || !visitDate) return "";
  const start = new Date(lmp);
  const visit = new Date(visitDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(visit.getTime())) return "";
  const diffMs = visit.getTime() - start.getTime();
  if (diffMs < 0) return "";
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return `${weeks} week${weeks === 1 ? "" : "s"} ${days} day${days === 1 ? "" : "s"}`;
}

function prettyDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Field components are defined at MODULE level (not inside the modal) so their
// identity stays stable across renders. Defining them inline caused React to
// remount every input on each keystroke, which dropped focus and scrolled the
// page back to the top on mobile while typing. They read form state from context.
const MaternalFormCtx = createContext<{
  form: FormData;
  set: (k: string, v: string) => void;
}>({ form: {}, set: () => {} });

const fieldCls =
  "min-h-[42px] w-full rounded-xl border border-[#BFDBFE] bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#2563EB] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

function Text({ k, ph, disabled }: { k: string; ph?: string; disabled?: boolean }) {
  const { form, set } = useContext(MaternalFormCtx);
  return (
    <input
      value={form[k] ?? ""}
      onChange={(e) => set(k, e.target.value)}
      placeholder={ph}
      disabled={disabled}
      className={fieldCls}
    />
  );
}
function DateI({ k, disabled }: { k: string; disabled?: boolean }) {
  const { form, set } = useContext(MaternalFormCtx);
  return (
    <input
      type="date"
      value={form[k] ?? ""}
      onChange={(e) => set(k, e.target.value)}
      disabled={disabled}
      className={fieldCls}
    />
  );
}
function NumI({ k, ph, disabled }: { k: string; ph?: string; disabled?: boolean }) {
  const { form, set } = useContext(MaternalFormCtx);
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      value={form[k] ?? ""}
      onChange={(e) => set(k, e.target.value.replace(/[^0-9]/g, ""))}
      placeholder={ph}
      disabled={disabled}
      className={fieldCls}
    />
  );
}
function ReadOnly({ value, note }: { value: string; note?: string }) {
  return (
    <div>
      <div className="flex min-h-[42px] items-center rounded-xl border border-[#BFDBFE] bg-slate-50 px-3 text-sm font-bold text-slate-700">
        {value || "—"}
      </div>
      {note && <p className="mt-1 text-[11px] font-semibold text-slate-400">{note}</p>}
    </div>
  );
}
function YesNo({ k, disabled }: { k: string; disabled?: boolean }) {
  const { form, set } = useContext(MaternalFormCtx);
  return (
    <div className="flex gap-2">
      {["Yes", "No"].map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => set(k, form[k] === opt ? "" : opt)}
          className={`min-h-[42px] flex-1 rounded-xl border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            form[k] === opt
              ? "border-[#2563EB] bg-[#2563EB] text-white"
              : "border-[#BFDBFE] bg-white text-slate-600 hover:bg-[#EFF6FF]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
function Select({ k, options, disabled }: { k: string; options: string[]; disabled?: boolean }) {
  const { form, set } = useContext(MaternalFormCtx);
  return (
    <select
      value={form[k] ?? ""}
      onChange={(e) => set(k, e.target.value)}
      disabled={disabled}
      className={fieldCls}
    >
      <option value="">Select</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[220px_1fr] sm:items-center sm:gap-2">
      <label className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</label>
      <div>{children}</div>
    </div>
  );
}
function TestRow({ label, k, disabled }: { label: string; k: string; disabled?: boolean }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[160px_1fr_150px] sm:items-center sm:gap-2">
      <label className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</label>
      <Text k={`${k}_result`} ph="Result" disabled={disabled} />
      <DateI k={`${k}_date`} disabled={disabled} />
    </div>
  );
}

function TextArea({ k, ph, disabled }: { k: string; ph?: string; disabled?: boolean }) {
  const { form, set } = useContext(MaternalFormCtx);
  return (
    <textarea
      value={form[k] ?? ""}
      onChange={(e) => set(k, e.target.value)}
      placeholder={ph}
      disabled={disabled}
      rows={3}
      className="w-full resize-y rounded-xl border border-[#BFDBFE] bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#2563EB] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
    />
  );
}

// Single checkbox chip: stores "Yes" / "" for its key. Used by the Family
// Planning physical-exam and method sections where several boxes may be ticked.
function Check({ k, label, disabled }: { k: string; label: string; disabled?: boolean }) {
  const { form, set } = useContext(MaternalFormCtx);
  const on = form[k] === "Yes";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => set(k, on ? "" : "Yes")}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        on
          ? "border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]"
          : "border-[#BFDBFE] bg-white text-slate-600 hover:bg-[#F8FAFC]"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-black ${
          on ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-slate-300 bg-white"
        }`}
      >
        {on ? "✓" : ""}
      </span>
      <span className="min-w-0">{label}</span>
    </button>
  );
}

function CheckGrid({ items, disabled }: { items: [string, string][]; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map(([k, l]) => (
        <Check key={k} k={k} label={l} disabled={disabled} />
      ))}
    </div>
  );
}

// Blood pressure is "high" at systolic ≥130 OR diastolic ≥90.
function isHighBp(v: string): boolean {
  const m = (v || "").match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (!m) return false;
  return Number(m[1]) >= 130 || Number(m[2]) >= 90;
}

// BP field that turns red (with a "High blood pressure" flag) at ≥130/90.
function BpInput({ k, disabled }: { k: string; ph?: string; disabled?: boolean }) {
  const { form, set } = useContext(MaternalFormCtx);
  const high = isHighBp(form[k] ?? "");
  return (
    <div>
      <input
        value={form[k] ?? ""}
        onChange={(e) => set(k, e.target.value)}
        placeholder="e.g. 120/80"
        disabled={disabled}
        className={`min-h-[42px] w-full rounded-xl border px-3 text-sm font-bold outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 ${
          high
            ? "border-red-400 bg-red-50 text-red-700 focus:border-red-500"
            : "border-[#BFDBFE] bg-white text-slate-900 focus:border-[#2563EB]"
        }`}
      />
      {high && (
        <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-red-600">
          High blood pressure (≥130/90)
        </p>
      )}
    </div>
  );
}

// Read-only chip for the prenatal Summary view (renders nothing when empty).
function SumChip({ label, value }: { label: string; value?: string }) {
  if (!value || !value.trim()) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

const PRENATAL_MONTH_FIELDS: [string, string][] = [
  ["date", "Date of Visit"],
  ["weight", "Weight (kg)"],
  ["bp", "Blood Pressure"],
  ["fundal", "Fundal Height (cm)"],
  ["fht", "Fetal Heart Tone"],
  ["remarks", "Findings / Remarks"],
];

// Tetanus Toxoid levels (TT1–TT5, plus a TT5+ booster).
const TT_LEVELS: [string, string][] = [
  ["tt1", "TT1"], ["tt2", "TT2"], ["tt3", "TT3"],
  ["tt4", "TT4"], ["tt5", "TT5"], ["tt5plus", "TT5+"],
];

const RISK_CODE_OPTIONS = [
  "A(1) - Too old (>35 yrs old)",
  "A(2) - Too young (<18 yrs old)",
  "B(1) - Height <145 cm (4'9\")",
  "B(2) - < Ideal weight",
  "B(3) - > Ideal weight",
  "C - Too many (>4 children)",
  "D - Poor obstetrical history",
  "E - Poor medical history",
  "F - Too close (<3 yrs gap of pregnancy)",
  "G - Risky lifestyle",
  "H - Violence against women",
  "I - 2 or more risks",
];

const PLAN_DELIVER_SECTOR = ["Private", "Public"];
const PLAN_DELIVER_TYPE = ["Hospital", "Lying-in"];

const PRENATAL_SUPPLEMENT_OPTIONS = [
  "Folic Acid",
  "Micronutrient",
  "Calcium Carbonate",
  "Deworming Tablet",
];

// Extra tests recorded per prenatal visit (and in the baseline test list).
const EXTRA_TESTS: { label: string; k: string }[] = [
  { label: "CBC / HGB & HCT", k: "cbc" },
  { label: "Diagnosed with Anemia", k: "anemia" },
  { label: "Gestational Diabetes Screen", k: "gdm_screen" },
  { label: "Positive for Diabetes", k: "diabetes" },
];

const POSTNATAL_DAYS = [0, 3, 7, 42];
const MATERNAL_TEST_KEYS = ["bloodtype", "fbs", "hbsag", "hemoglobin", "hiv", "syphilis", "tuberculosis", "urinalysis"];

// Field lists reused by the read-only Summary views for OB-Gyne and Postnatal.
const OBGYNE_SUMMARY_FIELDS: [string, string][] = [
  ["ob_g", "G"], ["ob_p", "P"], ["ob_fullterm", "Full Term"], ["ob_preterm", "Preterm"],
  ["ob_abortion", "Abortion"], ["ob_living", "Living"], ["menarche_age", "Menarche Age"],
  ["menstrual_cycle", "Menstrual Cycle"], ["menstrual_flow", "Menstrual Flow (days)"],
  ["coitarche_age", "Coitarche Age"], ["fp_method", "Current FP Method"],
];
const OBGYNE_TEST_KEYS: [string, string][] = [
  ["pap_smear", "Pap Smear"], ["via", "VIA"], ["sti", "History of STI"],
];
const PREGHIST_SUMMARY_FIELDS: [string, string][] = [
  ["ph_dentist", "Seen by Dentist"], ["ph_dentist_visits", "Dentist Visits"],
  ["ph_physician", "Seen by Physician"], ["ph_physician_visits", "Physician Visits"],
  ["ph_trimester_1", "1st Trimester Visits"], ["ph_trimester_2", "2nd Trimester Visits"],
  ["ph_trimester_3", "3rd Trimester Visits"], ["ph_other_tests", "Other Tests"],
];
const POSTNATAL_DELIVERY_FIELDS: [string, string][] = [
  ["post_delivery_date", "Date of Delivery"], ["post_place", "Place of Delivery"],
  ["post_type", "Type of Delivery"], ["post_outcome", "Outcome of Pregnancy"],
  ["post_bp", "Blood Pressure"],
  ["post_attended", "Attended By"], ["post_complications", "Complications"],
  ["post_newborn_sex", "Sex of Newborn"], ["post_birthweight", "Birthweight"],
  ["post_hemoglobin", "Hemoglobin"], ["post_hemoglobin_date", "Hemoglobin Date"],
  ["post_vitamin_a", "Vitamin A"], ["post_vitamin_a_date", "Vitamin A Date"],
];
const POSTNATAL_DAY_FIELDS: [string, string][] = [
  ["date", "Date of Visit"], ["bp", "Blood Pressure"], ["temp", "Temperature"],
  ["breastfeeding", "Breastfeeding"], ["counseling", "Counseling"], ["remarks", "Findings / Remarks"],
];

function hasObgyneData(d: FormData): boolean {
  return (
    OBGYNE_SUMMARY_FIELDS.some(([k]) => (d[k] ?? "").trim()) ||
    PREGHIST_SUMMARY_FIELDS.some(([k]) => (d[k] ?? "").trim()) ||
    OBGYNE_TEST_KEYS.some(([k]) => (d[`${k}_result`] ?? "").trim() || (d[`${k}_date`] ?? "").trim()) ||
    MATERNAL_TEST_KEYS.some((k) => (d[`ph_${k}_result`] ?? "").trim() || (d[`ph_${k}_date`] ?? "").trim())
  );
}
function hasPostnatalData(d: FormData): boolean {
  return (
    POSTNATAL_DELIVERY_FIELDS.some(([k]) => (d[k] ?? "").trim()) ||
    POSTNATAL_DAYS.some((day) => POSTNATAL_DAY_FIELDS.some(([s]) => (d[`postd${day}_${s}`] ?? "").trim()))
  );
}

export function MaternalRecordsTab() {
  const [residents, setResidents] = useState<PregnantResident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PregnantResident | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/maternal/residents", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load maternal records.");
        return;
      }
      setResidents(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error("MATERNAL_LOAD_ERROR", err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const query = search.toLowerCase().trim();
  const filtered = residents.filter((r) =>
    !query ? true : fullName(r).toLowerCase().includes(query)
  );

  return (
    <div className="space-y-5 pb-4">
      <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DBEAFE] text-[#2563EB]">
              <Baby className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">Maternal Records</h2>
              <p className="text-sm text-slate-500">
                Pregnant residents from registration. Select one to fill the maternal form.
              </p>
            </div>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pregnant resident..."
              className="min-h-[50px] w-full rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-[#2563EB] focus:bg-white"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[140px] items-center justify-center gap-3 rounded-2xl border border-[#BFDBFE] bg-white text-sm font-semibold text-[#2563EB]">
            <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#DBEAFE] border-t-[#2563EB]" />
            Loading pregnant residents...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#BFDBFE] bg-gradient-to-br from-[#EFF6FF] to-white p-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#2563EB] shadow-sm ring-1 ring-[#BFDBFE]">
              <Baby className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No pregnant residents</h3>
            <p className="mt-1 text-sm text-slate-500">
              Female residents marked pregnant during registration will appear here automatically.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {filtered.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-[#EFF6FF] p-3 shadow-sm">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#2563EB]">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-900">{fullName(r)}</p>
                    <p className="truncate text-xs font-semibold text-slate-500">
                      {r.age} yrs{r.sitio ? ` · ${r.sitio}` : ""}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                        r.hasRecord ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {r.hasRecord ? "Has Record" : "No Record"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(r)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#2563EB] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    {r.hasRecord ? "Update" : "Input"}
                  </button>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3">Resident Name</th>
                  <th className="px-3">Age</th>
                  <th className="px-3">Barangay</th>
                  <th className="px-3 text-center">Record</th>
                  <th className="px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="bg-[#EFF6FF] shadow-sm">
                    <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#2563EB]">
                          <UserRound className="h-4 w-4" />
                        </span>
                        <span className="block truncate whitespace-nowrap">{fullName(r)}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600">{r.age}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{r.sitio || "—"}</td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                          r.hasRecord
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {r.hasRecord ? "Has Record" : "No Record"}
                      </span>
                    </td>
                    <td className="rounded-r-2xl px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelected(r)}
                        title={r.hasRecord ? "View / update maternal records" : "Input maternal records"}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#2563EB] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        {r.hasRecord ? "View / Update" : "Input Records"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>

      {selected && (
        <MaternalFormModal
          resident={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function MaternalFormModal({
  resident,
  onClose,
  onSaved,
}: {
  resident: PregnantResident;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formTab, setFormTab] = useState<
    "obgyne" | "prenatal" | "postnatal" | "familyplanning"
  >("obgyne");
  // Family Planning has two nested tabs matching the paper form's two sides.
  const [fpSide, setFpSide] = useState<"a" | "b">("a");
  // Each tab is summary-first: when records already exist we show the read-only
  // summary and reveal the editable form via the Edit button; when a tab is
  // empty we open straight into editing.
  const [obgyneEditing, setObgyneEditing] = useState(true);
  const [prenatalEditing, setPrenatalEditing] = useState(true);
  const [postnatalEditing, setPostnatalEditing] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/maternal/${resident.id}`, { cache: "no-store" });
        const json = await res.json();
        const data: FormData = res.ok && json.record?.data ? (json.record.data as FormData) : {};
        setForm(data);
        const hasPrenatal =
          Boolean((data.lmp ?? "").trim()) ||
          [1, 2, 3, 4, 5, 6, 7, 8, 9].some((n) =>
            PRENATAL_MONTH_FIELDS.some(([s]) => (data[`pn${n}_${s}`] ?? "").trim())
          );
        setObgyneEditing(!hasObgyneData(data));
        setPrenatalEditing(!hasPrenatal);
        setPostnatalEditing(!hasPostnatalData(data));
      } catch (err) {
        console.error("MATERNAL_RECORD_LOAD_ERROR", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [resident.id]);

  // Whether any prenatal record has been encoded (controls the empty state in
  // the summary view).
  const hasPrenatalData =
    Boolean((form.lmp ?? "").trim()) ||
    [1, 2, 3, 4, 5, 6, 7, 8, 9].some((n) =>
      PRENATAL_MONTH_FIELDS.some(([s]) => (form[`pn${n}_${s}`] ?? "").trim())
    );

  const set = useCallback((k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v })), []);

  // Keep Expected Date of Delivery in sync with LMP (LMP + 280 days).
  useEffect(() => {
    if (!form.lmp) return;
    const edd = computeEdd(form.lmp);
    setForm((prev) => (prev.edd === edd ? prev : { ...prev, edd }));
  }, [form.lmp]);

  // Age of Gestation is derived live from LMP + today's date.
  const aog = computeGestation(form.lmp);

  // Family Planning Side B keeps a growing list of visit rows.
  const visitCount = Math.max(1, parseInt(form.fpb_visit_count || "1", 10) || 1);

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const payload = { ...form, edd: computeEdd(form.lmp ?? ""), gestation_age: aog };
      const res = await fetch(`/api/maternal/${resident.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to save maternal record.");
        return;
      }
      // Drop the prenatal editor back to the read-only summary after save.
      setObgyneEditing(false);
      setPrenatalEditing(false);
      setPostnatalEditing(false);
      setMessage("Maternal record saved.");
      setTimeout(() => onSaved(), 700);
    } catch (err) {
      console.error("MATERNAL_SAVE_ERROR", err);
      setError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  const TESTS: { label: string; k: string }[] = [
    { label: "Bloodtype", k: "bloodtype" },
    { label: "FBS / HBA1C / RBS", k: "fbs" },
    { label: "HBsAg", k: "hbsag" },
    { label: "Hemoglobin", k: "hemoglobin" },
    { label: "HIV", k: "hiv" },
    { label: "Syphilis", k: "syphilis" },
    { label: "Tuberculosis", k: "tuberculosis" },
    { label: "Urinalysis", k: "urinalysis" },
  ];

  return (
    <MaternalFormCtx.Provider value={{ form, set }}>
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:p-4">
      <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden border border-[#BFDBFE] bg-white shadow-2xl sm:h-[92vh] sm:rounded-[28px]">
        <div className="flex items-center justify-between gap-3 border-b border-[#BFDBFE] bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] p-4 text-white sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <HeartPulse className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-white/70">
                Maternal Record
              </p>
              <h3 className="text-xl font-black">{fullName(resident)}</h3>
              <p className="text-xs text-white/70">
                {resident.age} yrs{resident.sitio ? ` · ${resident.sitio}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-5">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center gap-3 text-sm font-semibold text-[#2563EB]">
              <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#DBEAFE] border-t-[#2563EB]" />
              Loading record...
            </div>
          ) : (
            <div className="space-y-5">
              {/* Sub-tabs: OB-Gyne History · Prenatal Care · Postnatal Care */}
              <div className="flex gap-1 rounded-2xl bg-[#EFF6FF] p-1.5">
                {([
                  ["obgyne", "OB-Gyne History"],
                  ["prenatal", "Prenatal Care"],
                  ["postnatal", "Postnatal Care"],
                  ["familyplanning", "Family Planning"],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFormTab(id)}
                    className={`flex-1 rounded-xl px-2 py-2.5 text-[11px] font-black uppercase tracking-wide transition sm:text-xs ${
                      formTab === id
                        ? "bg-[#2563EB] text-white shadow-sm"
                        : "text-slate-500 hover:bg-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {formTab === "obgyne" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 text-xs font-semibold text-slate-500">
                      {obgyneEditing
                        ? "Encode OB-Gyne history below, then Save."
                        : "Summary of encoded OB-Gyne history."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setObgyneEditing((v) => !v)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#BFDBFE] bg-white px-3 py-2 text-xs font-black text-[#2563EB] transition hover:bg-[#EFF6FF]"
                    >
                      {obgyneEditing ? (
                        <><Eye className="h-3.5 w-3.5" /> View Summary</>
                      ) : (
                        <><Pencil className="h-3.5 w-3.5" /> Edit</>
                      )}
                    </button>
                  </div>

                  {obgyneEditing ? (
                    <div className="space-y-6">
                      <Section title="For Women — OB-Gyne History">
                        <Row label="OB Score">
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                            {[
                              ["G", "ob_g"], ["P", "ob_p"], ["Full Term", "ob_fullterm"],
                              ["Preterm", "ob_preterm"], ["Abortion", "ob_abortion"], ["Living", "ob_living"],
                            ].map(([lbl, k]) => (
                              <div key={k}>
                                <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">{lbl}</p>
                                <Text k={k} />
                              </div>
                            ))}
                          </div>
                        </Row>
                        <Row label="Menarche Age"><NumI k="menarche_age" /></Row>
                        <Row label="Menstrual Cycle"><Select k="menstrual_cycle" options={["Regular", "Irregular"]} /></Row>
                        <Row label="Menstrual Flow (days)"><NumI k="menstrual_flow" /></Row>
                        <Row label="Coitarche Age"><NumI k="coitarche_age" /></Row>
                        <Row label="Current FP Method"><Text k="fp_method" /></Row>
                        <TestRow label="Pap Smear" k="pap_smear" />
                        <TestRow label="VIA" k="via" />
                        <TestRow label="History of STI" k="sti" />
                      </Section>

                      <Section title="Pregnancy History">
                        <Row label="Seen by Dentist">
                          <div className="grid gap-2 sm:grid-cols-2"><YesNo k="ph_dentist" /><Text k="ph_dentist_visits" ph="No. of visits" /></div>
                        </Row>
                        <Row label="Seen by Physician">
                          <div className="grid gap-2 sm:grid-cols-2"><YesNo k="ph_physician" /><Text k="ph_physician_visits" ph="No. of visits" /></div>
                        </Row>
                        <Row label="Visits per Trimester">
                          <div className="grid grid-cols-3 gap-2">
                            {["1st", "2nd", "3rd"].map((t, i) => (
                              <div key={t}>
                                <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">{t} Trimester</p>
                                <Text k={`ph_trimester_${i + 1}`} />
                              </div>
                            ))}
                          </div>
                        </Row>
                        <SubTitle title="Tests (Result / Date)" />
                        {TESTS.map((t) => <TestRow key={`ph_${t.k}`} label={t.label} k={`ph_${t.k}`} />)}
                        <Row label="Other Tests, Specify"><Text k="ph_other_tests" /></Row>
                      </Section>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-[#BFDBFE] bg-white p-4 shadow-sm">
                        <h4 className="mb-3 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                          For Women — OB-Gyne History
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {OBGYNE_SUMMARY_FIELDS.map(([k, label]) => (
                            <SumChip key={k} label={label} value={form[k]} />
                          ))}
                          {OBGYNE_TEST_KEYS.map(([k, label]) => {
                            const r = (form[`${k}_result`] ?? "").trim();
                            const dt = (form[`${k}_date`] ?? "").trim();
                            return (
                              <SumChip key={k} label={label} value={[r, dt ? `(${dt})` : ""].filter(Boolean).join(" ")} />
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#BFDBFE] bg-white p-4 shadow-sm">
                        <h4 className="mb-3 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                          Pregnancy History
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {PREGHIST_SUMMARY_FIELDS.map(([k, label]) => (
                            <SumChip key={k} label={label} value={form[k]} />
                          ))}
                          {TESTS.map((t) => {
                            const r = (form[`ph_${t.k}_result`] ?? "").trim();
                            const dt = (form[`ph_${t.k}_date`] ?? "").trim();
                            return (
                              <SumChip key={t.k} label={t.label} value={[r, dt ? `(${dt})` : ""].filter(Boolean).join(" ")} />
                            );
                          })}
                        </div>
                      </div>

                      {!hasObgyneData(form) && (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-400">
                          No OB-Gyne history yet. Tap Edit to start encoding.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {formTab === "prenatal" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 text-xs font-semibold text-slate-500">
                      {prenatalEditing
                        ? "Encode prenatal records below, then Save."
                        : "Summary of encoded prenatal records."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPrenatalEditing((v) => !v)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#BFDBFE] bg-white px-3 py-2 text-xs font-black text-[#2563EB] transition hover:bg-[#EFF6FF]"
                    >
                      {prenatalEditing ? (
                        <><Eye className="h-3.5 w-3.5" /> View Summary</>
                      ) : (
                        <><Pencil className="h-3.5 w-3.5" /> Edit</>
                      )}
                    </button>
                  </div>

                  {prenatalEditing ? (
                    <>
                      <Section title="Present Pregnancy — Baseline">
                        <Row label="Last Menstrual Period"><DateI k="lmp" /></Row>
                        <Row label="Expected Date of Delivery">
                          <ReadOnly value={prettyDate(form.edd ?? "")} note="Auto: LMP + 280 days" />
                        </Row>
                        <Row label="Age of Gestation">
                          <ReadOnly value={aog} note="Auto from LMP, updates daily" />
                        </Row>
                        <Row label="Risk Code"><Select k="risk_code" options={RISK_CODE_OPTIONS} /></Row>
                        <Row label="Mother-Baby Book"><YesNo k="mother_baby_book" /></Row>
                        <Row label="Tetanus Toxoid (TT1–TT5+)">
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                            {TT_LEVELS.map(([k, label]) => (
                              <div key={k}>
                                <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">{label}</p>
                                <DateI k={k} />
                              </div>
                            ))}
                          </div>
                        </Row>
                        <Row label="Plan to Deliver At">
                          <div className="grid gap-2 sm:grid-cols-3">
                            <Select k="plan_deliver_sector" options={PLAN_DELIVER_SECTOR} />
                            <Select k="plan_deliver_type" options={PLAN_DELIVER_TYPE} />
                            <Text k="plan_deliver_facility" ph="Name of facility" />
                          </div>
                        </Row>
                        <Row label="Accompanying Person"><Text k="accompanying" /></Row>
                        <Row label="Iodized Salt"><YesNo k="iodized_salt" /></Row>
                        <Row label="Iron Supplement"><YesNo k="iron_supplement" /></Row>
                        <Row label="Prenatal Supplementation"><Select k="prenatal_supplement" options={PRENATAL_SUPPLEMENT_OPTIONS} /></Row>
                        <Row label="Seen by Dentist">
                          <div className="grid gap-2 sm:grid-cols-2"><YesNo k="pre_dentist" /><DateI k="pre_dentist_date" /></div>
                        </Row>
                        <Row label="Seen by Physician">
                          <div className="grid gap-2 sm:grid-cols-2"><YesNo k="pre_physician" /><DateI k="pre_physician_date" /></div>
                        </Row>
                        <SubTitle title="Tests (Result / Date)" />
                        {TESTS.map((t) => <TestRow key={`pre_${t.k}`} label={t.label} k={`pre_${t.k}`} />)}
                        {EXTRA_TESTS.map((t) => <TestRow key={`pre_${t.k}`} label={t.label} k={`pre_${t.k}`} />)}
                        <Row label="Other Tests, Specify"><Text k="pre_other_tests" /></Row>
                      </Section>

                      <p className="rounded-xl bg-[#EFF6FF] px-4 py-2.5 text-xs font-semibold text-[#2563EB]">
                        Monthly prenatal visits (9 months). Each month opens only
                        after the previous month&apos;s Date of Visit is filled in.
                      </p>

                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                        // A month opens only when every earlier month has a
                        // Date of Visit — you can't skip ahead.
                        const unlocked = [...Array(n - 1)].every(
                          (_, i) => (form[`pn${i + 1}_date`] ?? "").trim()
                        );
                        return (
                        <div key={n} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <h4 className="mb-3 text-sm font-black text-slate-800">Prenatal Visit {n} — Month {n}</h4>
                          {!unlocked ? (
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                              <Lock className="h-3.5 w-3.5" /> Fill in Month {n - 1}&apos;s Date of Visit first.
                            </p>
                          ) : (
                          <div className="space-y-3">
                            <Row label="Date of Visit"><DateI k={`pn${n}_date`} /></Row>
                            <Row label="Age of Gestation">
                              <ReadOnly
                                value={gestationBetween(form.lmp, form[`pn${n}_date`])}
                                note="Auto: Date of Visit − LMP"
                              />
                            </Row>
                            <Row label="Weight (kg)"><Text k={`pn${n}_weight`} /></Row>
                            <Row label="Blood Pressure"><Text k={`pn${n}_bp`} /></Row>
                            <Row label="Fundal Height (cm)"><Text k={`pn${n}_fundal`} /></Row>
                            <Row label="Fetal Heart Tone"><Text k={`pn${n}_fht`} /></Row>
                            <Row label="Findings / Remarks"><Text k={`pn${n}_remarks`} /></Row>
                            <div className="rounded-xl border border-[#BFDBFE] bg-[#F8FAFC] p-3">
                              <SubTitle title="Test Result / Date (this month)" />
                              <div className="mt-2 space-y-2">
                                {EXTRA_TESTS.map((t) => (
                                  <TestRow key={`pn${n}_${t.k}`} label={t.label} k={`pn${n}_${t.k}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          )}
                        </div>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-[#BFDBFE] bg-white p-4 shadow-sm">
                        <h4 className="mb-3 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                          Present Pregnancy — Baseline
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <SumChip label="Last Menstrual Period" value={prettyDate(form.lmp ?? "")} />
                          <SumChip label="Expected Date of Delivery" value={prettyDate(form.edd ?? "")} />
                          <SumChip label="Age of Gestation" value={aog} />
                          <SumChip label="Risk Code" value={form.risk_code} />
                          <SumChip label="Mother-Baby Book" value={form.mother_baby_book} />
                          {TT_LEVELS.map(([k, label]) => (
                            <SumChip key={k} label={label} value={prettyDate(form[k] ?? "")} />
                          ))}
                          <SumChip
                            label="Plan to Deliver At"
                            value={[form.plan_deliver_sector, form.plan_deliver_type, form.plan_deliver_facility].filter((v) => (v ?? "").trim()).join(" · ")}
                          />
                          <SumChip label="Accompanying Person" value={form.accompanying} />
                          <SumChip label="Iodized Salt" value={form.iodized_salt} />
                          <SumChip label="Iron Supplement" value={form.iron_supplement} />
                          <SumChip label="Prenatal Supplementation" value={form.prenatal_supplement} />
                          <SumChip label="Seen by Dentist" value={form.pre_dentist} />
                          <SumChip label="Dentist Date" value={form.pre_dentist_date} />
                          <SumChip label="Seen by Physician" value={form.pre_physician} />
                          <SumChip label="Physician Date" value={form.pre_physician_date} />
                          {[...TESTS, ...EXTRA_TESTS].map((t) => {
                            const r = (form[`pre_${t.k}_result`] ?? "").trim();
                            const d = (form[`pre_${t.k}_date`] ?? "").trim();
                            return (
                              <SumChip
                                key={t.k}
                                label={t.label}
                                value={[r, d ? `(${d})` : ""].filter(Boolean).join(" ")}
                              />
                            );
                          })}
                          <SumChip label="Other Tests" value={form.pre_other_tests} />
                        </div>
                      </div>

                      {[1, 2, 3, 4, 5, 6, 7, 8, 9]
                        .filter((n) => PRENATAL_MONTH_FIELDS.some(([s]) => (form[`pn${n}_${s}`] ?? "").trim()))
                        .map((n) => (
                          <div key={n} className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                            <h4 className="mb-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                              Prenatal Visit {n} — Month {n}
                            </h4>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <SumChip label="Date of Visit" value={form[`pn${n}_date`]} />
                              <SumChip
                                label="Age of Gestation"
                                value={gestationBetween(form.lmp, form[`pn${n}_date`])}
                              />
                              {PRENATAL_MONTH_FIELDS.filter(([s]) => s !== "date").map(([s, label]) => (
                                <SumChip key={s} label={label} value={form[`pn${n}_${s}`]} />
                              ))}
                              {EXTRA_TESTS.map((t) => {
                                const r = (form[`pn${n}_${t.k}_result`] ?? "").trim();
                                const d = (form[`pn${n}_${t.k}_date`] ?? "").trim();
                                return (
                                  <SumChip
                                    key={t.k}
                                    label={t.label}
                                    value={[r, d ? `(${d})` : ""].filter(Boolean).join(" ")}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}

                      {!hasPrenatalData && (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-400">
                          No prenatal records yet. Tap Edit to start encoding.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {formTab === "postnatal" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 text-xs font-semibold text-slate-500">
                      {postnatalEditing
                        ? "Encode postnatal records below, then Save."
                        : "Summary of encoded postnatal records."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPostnatalEditing((v) => !v)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#BFDBFE] bg-white px-3 py-2 text-xs font-black text-[#2563EB] transition hover:bg-[#EFF6FF]"
                    >
                      {postnatalEditing ? (
                        <><Eye className="h-3.5 w-3.5" /> View Summary</>
                      ) : (
                        <><Pencil className="h-3.5 w-3.5" /> Edit</>
                      )}
                    </button>
                  </div>

                  {postnatalEditing ? (
                    <>
                      <Section title="Delivery Details">
                        <Row label="Date of Delivery"><DateI k="post_delivery_date" /></Row>
                        <Row label="Place of Delivery"><Text k="post_place" /></Row>
                        <Row label="Type of Delivery"><Select k="post_type" options={["Normal", "Caesarean Section"]} /></Row>
                        <Row label="Outcome of Pregnancy"><Text k="post_outcome" /></Row>
                        <Row label="Blood Pressure (BP Measured)"><BpInput k="post_bp" /></Row>
                        <Row label="Attended By"><Text k="post_attended" /></Row>
                        <Row label="Complications"><Text k="post_complications" /></Row>
                        <Row label="Sex of Newborn">
                          <div>
                            <Select k="post_newborn_sex" options={["Female", "Male", "Death"]} />
                            {form.post_newborn_sex === "Death" && (
                              <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-red-600">
                                Considered as abortion
                              </p>
                            )}
                          </div>
                        </Row>
                        <Row label="Birthweight"><Text k="post_birthweight" /></Row>
                        <Row label="Hemoglobin">
                          <div className="grid gap-2 sm:grid-cols-2"><YesNo k="post_hemoglobin" /><DateI k="post_hemoglobin_date" /></div>
                        </Row>
                        <Row label="Vitamin A">
                          <div className="grid gap-2 sm:grid-cols-2"><YesNo k="post_vitamin_a" /><DateI k="post_vitamin_a_date" /></div>
                        </Row>
                      </Section>

                      <p className="rounded-xl bg-[#EFF6FF] px-4 py-2.5 text-xs font-semibold text-[#2563EB]">
                        Postnatal visits (Day 0, 3, 7, 42). Each visit opens only after
                        the previous visit&apos;s Date of Visit is filled in.
                      </p>

                      {POSTNATAL_DAYS.map((day, idx) => {
                        // A visit opens only when every earlier day has a Date of
                        // Visit — you can't skip ahead.
                        const unlocked = POSTNATAL_DAYS.slice(0, idx).every(
                          (d) => (form[`postd${d}_date`] ?? "").trim()
                        );
                        return (
                          <div key={day} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h4 className="mb-3 text-sm font-black text-slate-800">Postnatal Visit — Day {day}</h4>
                            {!unlocked ? (
                              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                                <Lock className="h-3.5 w-3.5" /> Fill in the Day {POSTNATAL_DAYS[idx - 1]} visit&apos;s Date of Visit first.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                <Row label="Date of Visit"><DateI k={`postd${day}_date`} /></Row>
                                <Row label="Blood Pressure"><BpInput k={`postd${day}_bp`} /></Row>
                                <Row label="Temperature"><Text k={`postd${day}_temp`} /></Row>
                                <Row label="Breastfeeding"><YesNo k={`postd${day}_breastfeeding`} /></Row>
                                <Row label="Counseling"><YesNo k={`postd${day}_counseling`} /></Row>
                                <Row label="Findings / Remarks"><Text k={`postd${day}_remarks`} /></Row>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-[#BFDBFE] bg-white p-4 shadow-sm">
                        <h4 className="mb-3 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                          Delivery Details
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {POSTNATAL_DELIVERY_FIELDS.map(([k, label]) => (
                            <SumChip key={k} label={label} value={form[k]} />
                          ))}
                        </div>
                      </div>

                      {POSTNATAL_DAYS.filter((day) =>
                        POSTNATAL_DAY_FIELDS.some(([s]) => (form[`postd${day}_${s}`] ?? "").trim())
                      ).map((day) => (
                        <div key={day} className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                          <h4 className="mb-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                            Postnatal Visit — Day {day}
                          </h4>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {POSTNATAL_DAY_FIELDS.map(([s, label]) => (
                              <SumChip key={s} label={label} value={form[`postd${day}_${s}`]} />
                            ))}
                          </div>
                        </div>
                      ))}

                      {!hasPostnatalData(form) && (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-400">
                          No postnatal records yet. Tap Edit to start encoding.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {formTab === "familyplanning" && (
                <div className="space-y-5">
                  {/* Nested Side A / Side B tabs (matching the paper form) */}
                  <div className="flex gap-1 rounded-2xl bg-[#DBEAFE] p-1.5">
                    {([
                      ["a", "Side A — Assessment"],
                      ["b", "Side B — Visits"],
                    ] as const).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFpSide(id)}
                        className={`flex-1 rounded-xl px-2 py-2.5 text-[11px] font-black uppercase tracking-wide transition sm:text-xs ${
                          fpSide === id
                            ? "bg-[#2563EB] text-white shadow-sm"
                            : "text-slate-600 hover:bg-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {fpSide === "a" && (
                    <>
                      <Section title="Client Type & FP Method">
                        <Row label="Type of Client">
                          <Select k="fpa_client_type" options={["New Acceptor", "Current User", "Changing Method", "Changing Clinic", "Dropout / Restart"]} />
                        </Row>
                        <Row label="Reason for FP">
                          <Select k="fpa_fp_reason" options={["Spacing", "Limiting", "Others"]} />
                        </Row>
                        <Row label="Reason for Changing">
                          <Text k="fpa_change_reason" ph="Medical condition / side effects / others" />
                        </Row>
                        <div>
                          <SubTitle title="Method Currently Used (for Changing Method)" />
                          <div className="mt-3">
                            <CheckGrid items={[
                              ["fpa_m_coc", "COC"], ["fpa_m_pop", "POP"], ["fpa_m_injectable", "Injectable"],
                              ["fpa_m_iud_interval", "IUD (Interval)"], ["fpa_m_iud_pp", "IUD (Post-Partum)"], ["fpa_m_condom", "Condom"],
                              ["fpa_m_bom", "BOM / CMM"], ["fpa_m_bbt", "BBT"], ["fpa_m_stm", "STM"],
                              ["fpa_m_sdm", "SDM"], ["fpa_m_lam", "LAM"],
                            ]} />
                          </div>
                          <div className="mt-3">
                            <Row label="Others (specify)"><Text k="fpa_m_others" ph="Other method" /></Row>
                          </div>
                        </div>
                      </Section>

                      <Section title="I. Medical History">
                        <p className="text-xs font-semibold text-slate-500">Does the client have any of the following?</p>
                        {([
                          ["fpa_mh_headache", "Severe headaches / migraine"],
                          ["fpa_mh_stroke", "History of stroke / heart attack / hypertension"],
                          ["fpa_mh_bruising", "Non-traumatic hematoma, bruising or gum bleeding"],
                          ["fpa_mh_breast", "Current or history of breast cancer / breast mass"],
                          ["fpa_mh_chestpain", "Severe chest pain"],
                          ["fpa_mh_cough", "Cough for more than 14 days"],
                          ["fpa_mh_jaundice", "Jaundice (yellowish skin or eyes)"],
                          ["fpa_mh_bleeding", "Unexplained vaginal bleeding"],
                          ["fpa_mh_discharge", "Abnormal vaginal discharge"],
                          ["fpa_mh_meds", "Intake of anti-seizure (phenobarbital) or anti-TB (rifampicin)"],
                          ["fpa_mh_smoker", "Is the client a SMOKER?"],
                          ["fpa_mh_disability", "With Disability?"],
                        ] as [string, string][]).map(([k, l]) => (
                          <Row key={k} label={l}><YesNo k={k} /></Row>
                        ))}
                        <Row label="If disabled, specify"><Text k="fpa_mh_disability_note" ph="Specify disability" /></Row>
                      </Section>

                      <Section title="II. Obstetrical History">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Row label="Gravida (G)"><NumI k="fpa_ob_g" /></Row>
                          <Row label="Para (P)"><NumI k="fpa_ob_p" /></Row>
                          <Row label="Full Term"><NumI k="fpa_ob_fullterm" /></Row>
                          <Row label="Premature"><NumI k="fpa_ob_premature" /></Row>
                          <Row label="Abortion"><NumI k="fpa_ob_abortion" /></Row>
                          <Row label="Living Children"><NumI k="fpa_ob_living" /></Row>
                        </div>
                        <Row label="Date of Last Delivery"><DateI k="fpa_ob_last_delivery" /></Row>
                        <Row label="Type of Last Delivery"><Select k="fpa_ob_delivery_type" options={["Vaginal", "Cesarean Section"]} /></Row>
                        <Row label="Last Menstrual Period"><DateI k="fpa_ob_lmp" /></Row>
                        <Row label="Previous Menstrual Period"><DateI k="fpa_ob_pmp" /></Row>
                        <Row label="Menstrual Flow"><Select k="fpa_ob_flow" options={["Scanty (1-2 pads/day)", "Moderate (3-5 pads/day)", "Heavy (>5 pads/day)"]} /></Row>
                        <Row label="Dysmenorrhea"><YesNo k="fpa_ob_dysmenorrhea" /></Row>
                        <Row label="Hydatidiform Mole (last 12 months)"><YesNo k="fpa_ob_mole" /></Row>
                        <Row label="History of Ectopic Pregnancy"><YesNo k="fpa_ob_ectopic" /></Row>
                      </Section>

                      <Section title="III. Risks for Sexually Transmitted Infections">
                        <p className="text-xs font-semibold text-slate-500">Does the client or client&apos;s partner have any of the following?</p>
                        {([
                          ["fpa_sti_discharge", "Abnormal discharge from the genital area"],
                          ["fpa_sti_sores", "Sores or ulcers in the genital area"],
                          ["fpa_sti_pain", "Pain or burning sensation in the genital area"],
                          ["fpa_sti_history", "History of treatment for STI"],
                          ["fpa_sti_hiv", "HIV / AIDS / Pelvic inflammatory disease"],
                        ] as [string, string][]).map(([k, l]) => (
                          <Row key={k} label={l}><YesNo k={k} /></Row>
                        ))}
                      </Section>

                      <Section title="IV. Risks for Violence Against Women (VAW)">
                        {([
                          ["fpa_vaw_relationship", "Unpleasant relationship with partner"],
                          ["fpa_vaw_approval", "Partner does not approve of the visit to FP clinic"],
                          ["fpa_vaw_history", "History of domestic violence or VAW"],
                        ] as [string, string][]).map(([k, l]) => (
                          <Row key={k} label={l}><YesNo k={k} /></Row>
                        ))}
                        <Row label="Referred To"><Select k="fpa_vaw_referred" options={["DSWD", "WCPU", "NGO", "Others"]} /></Row>
                      </Section>

                      <Section title="V. Physical Examination">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Row label="Weight (kg)"><Text k="fpa_pe_weight" ph="kg" /></Row>
                          <Row label="Height (cm)"><Text k="fpa_pe_height" ph="cm" /></Row>
                          <Row label="Blood Pressure"><Text k="fpa_pe_bp" ph="mmHg" /></Row>
                          <Row label="Pulse Rate"><Text k="fpa_pe_pulse" ph="/min" /></Row>
                        </div>
                        <div><SubTitle title="Skin" /><div className="mt-2"><CheckGrid items={[["fpa_pe_skin_normal", "Normal"], ["fpa_pe_skin_pale", "Pale"], ["fpa_pe_skin_yellow", "Yellowish"], ["fpa_pe_skin_hematoma", "Hematoma"]]} /></div></div>
                        <div><SubTitle title="Conjunctiva" /><div className="mt-2"><CheckGrid items={[["fpa_pe_conj_normal", "Normal"], ["fpa_pe_conj_pale", "Pale"], ["fpa_pe_conj_yellow", "Yellowish"]]} /></div></div>
                        <div><SubTitle title="Neck" /><div className="mt-2"><CheckGrid items={[["fpa_pe_neck_normal", "Normal"], ["fpa_pe_neck_mass", "Neck Mass"], ["fpa_pe_neck_nodes", "Enlarged Lymph Nodes"]]} /></div></div>
                        <div><SubTitle title="Breast" /><div className="mt-2"><CheckGrid items={[["fpa_pe_breast_normal", "Normal"], ["fpa_pe_breast_mass", "Mass"], ["fpa_pe_breast_discharge", "Nipple Discharge"]]} /></div></div>
                        <div><SubTitle title="Abdomen" /><div className="mt-2"><CheckGrid items={[["fpa_pe_abd_normal", "Normal"], ["fpa_pe_abd_mass", "Abdominal Mass"], ["fpa_pe_abd_varicose", "Varicosities"]]} /></div></div>
                        <div><SubTitle title="Extremities" /><div className="mt-2"><CheckGrid items={[["fpa_pe_ext_normal", "Normal"], ["fpa_pe_ext_edema", "Edema"], ["fpa_pe_ext_varicose", "Varicosities"]]} /></div></div>
                        <div><SubTitle title="Pelvic Examination" /><div className="mt-2"><CheckGrid items={[["fpa_pe_pelvic_normal", "Normal"], ["fpa_pe_pelvic_mass", "Mass"], ["fpa_pe_pelvic_discharge", "Abnormal Discharge"], ["fpa_pe_pelvic_cervix", "Cervical Abnormalities"], ["fpa_pe_pelvic_warts", "Warts"], ["fpa_pe_pelvic_polyp", "Polyp or Cyst"], ["fpa_pe_pelvic_inflammation", "Inflammation / Erosion"], ["fpa_pe_pelvic_bloody", "Bloody Discharge"], ["fpa_pe_pelvic_tenderness", "Cervical Tenderness"]]} /></div></div>
                        <Row label="Uterine Depth (cm)"><Text k="fpa_pe_uterine_depth" ph="cm" /></Row>
                      </Section>

                      <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-xs font-semibold text-slate-600">
                        Acknowledgement: This certifies that the physician / nurse / midwife has fully explained the different methods available in family planning and the client has freely chosen a method. For WRA below 18 years old, parent / guardian consent is required.
                      </div>
                    </>
                  )}

                  {fpSide === "b" && (
                    <>
                      <Section title="How to be Reasonably Sure a Client is Not Pregnant">
                        {([
                          ["fpb_np_1", "Did you have a baby less than 6 months ago, are fully / nearly fully breastfeeding, and have had no menstrual period since?"],
                          ["fpb_np_2", "Have you abstained from sexual intercourse since your last menstrual period or delivery?"],
                          ["fpb_np_3", "Have you had a baby in the last 4 weeks?"],
                          ["fpb_np_4", "Did your last menstrual period start within the past 7 days?"],
                          ["fpb_np_5", "Have you had a miscarriage or abortion in the last 7 days?"],
                          ["fpb_np_6", "Have you been using a reliable contraceptive method consistently and correctly?"],
                        ] as [string, string][]).map(([k, l]) => (
                          <Row key={k} label={l}><YesNo k={k} /></Row>
                        ))}
                        <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-xs font-semibold text-slate-600">
                          If the client answered YES to at least one question, provide the client with the desired method. If NO to all, pregnancy cannot be ruled out — the client should await menses or take a pregnancy test.
                        </div>
                      </Section>

                      <Section title="Client Assessment Record — Visits">
                        <div className="space-y-4">
                          {Array.from({ length: visitCount }).map((_, i) => {
                            const n = i + 1;
                            return (
                              <div key={n} className="rounded-2xl border border-[#BFDBFE] bg-[#F8FAFC] p-4">
                                <p className="mb-3 text-xs font-black uppercase tracking-wide text-[#2563EB]">Visit {n}</p>
                                <div className="space-y-3">
                                  <Row label="Date of Visit"><DateI k={`fpb_v${n}_date`} /></Row>
                                  <Row label="Medical Findings"><TextArea k={`fpb_v${n}_findings`} ph="Observation, complaints, service rendered / procedures, laboratory, treatment and referral" /></Row>
                                  <Row label="Method Accepted"><Text k={`fpb_v${n}_method`} ph="Method accepted" /></Row>
                                  <Row label="Service Provider"><Text k={`fpb_v${n}_provider`} ph="Name of service provider" /></Row>
                                  <Row label="Date of Follow-up"><DateI k={`fpb_v${n}_followup`} /></Row>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => set("fpb_visit_count", String(visitCount + 1))}
                          className="mt-4 inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#2563EB] bg-white px-4 text-sm font-bold text-[#2563EB] transition hover:bg-[#EFF6FF]"
                        >
                          + Add Visit
                        </button>
                      </Section>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#BFDBFE] bg-white p-4">
          <div className="text-sm">
            {error && <span className="font-semibold text-red-600">{error}</span>}
            {message && (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {message}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[46px] rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || loading}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-2xl bg-[#2563EB] px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Maternal Record"}
            </button>
          </div>
        </div>
      </div>
    </div>
    </MaternalFormCtx.Provider>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#BFDBFE] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 rounded-xl bg-[#2563EB] px-4 py-2">
        <h4 className="text-sm font-black uppercase tracking-wide text-white">{title}</h4>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SubTitle({ title }: { title: string }) {
  return (
    <p className="border-b border-[#BFDBFE] pb-1 text-xs font-black uppercase tracking-wide text-[#2563EB]">
      {title}
    </p>
  );
}
