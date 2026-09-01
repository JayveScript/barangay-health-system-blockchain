"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  Baby,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  Lock,
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
  const [loadedData, setLoadedData] = useState<FormData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formTab, setFormTab] = useState<"obgyne" | "prenatal" | "postnatal">("obgyne");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/maternal/${resident.id}`, { cache: "no-store" });
        const json = await res.json();
        if (res.ok && json.record?.data) {
          setForm(json.record.data as FormData);
          setLoadedData(json.record.data as FormData);
        }
      } catch (err) {
        console.error("MATERNAL_RECORD_LOAD_ERROR", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [resident.id]);

  // Sequential unlock: a visit is "locked/complete" once it was saved (its date
  // was set on load). The next visit becomes editable; later ones stay locked.
  const POSTNATAL_DAYS = [0, 3, 7, 42];
  const prenatalActive = (() => {
    for (let i = 1; i <= 9; i++) {
      if (!(loadedData[`pn${i}_date`] ?? "").trim()) return i;
    }
    return 10; // all 9 completed
  })();
  const postnatalActive = (() => {
    for (let idx = 0; idx < POSTNATAL_DAYS.length; idx++) {
      if (!(loadedData[`postd${POSTNATAL_DAYS[idx]}_date`] ?? "").trim()) return idx;
    }
    return POSTNATAL_DAYS.length; // all completed
  })();

  // The Present Pregnancy baseline is entered once and then frozen — LMP is the
  // anchor, so once it has been saved the whole baseline becomes read-only.
  // (Age of Gestation still updates live from LMP each day.)
  const baselineLocked = Boolean((loadedData.lmp ?? "").trim());

  const set = useCallback((k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v })), []);

  // Keep Expected Date of Delivery in sync with LMP (LMP + 280 days).
  useEffect(() => {
    if (!form.lmp) return;
    const edd = computeEdd(form.lmp);
    setForm((prev) => (prev.edd === edd ? prev : { ...prev, edd }));
  }, [form.lmp]);

  // Age of Gestation is derived live from LMP + today's date.
  const aog = computeGestation(form.lmp);

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
      // Advance the sequential unlock immediately (a filled visit becomes locked,
      // the next one opens) without waiting for a reload.
      setLoadedData(payload);
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
              )}

              {formTab === "prenatal" && (
                <div className="space-y-4">
                  <Section title="Present Pregnancy — Baseline">
                    {baselineLocked ? (
                      <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                        <Lock className="h-3.5 w-3.5" />
                        Baseline locked — set once at the first visit. Age of Gestation still updates daily.
                      </div>
                    ) : (
                      <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                        Fill this once. After saving, the baseline is locked and cannot be changed.
                      </div>
                    )}
                    <Row label="Last Menstrual Period"><DateI k="lmp" disabled={baselineLocked} /></Row>
                    <Row label="Expected Date of Delivery">
                      <ReadOnly value={prettyDate(form.edd ?? "")} note="Auto: LMP + 280 days" />
                    </Row>
                    <Row label="Age of Gestation">
                      <ReadOnly value={aog} note="Auto from LMP, updates daily" />
                    </Row>
                    <Row label="Risk Code"><Text k="risk_code" disabled={baselineLocked} /></Row>
                    <Row label="Mother-Baby Book"><YesNo k="mother_baby_book" disabled={baselineLocked} /></Row>
                    <Row label="Tetanus Toxoid (TT1–TT5)">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {["1", "2", "3", "4", "5"].map((n) => (
                          <div key={n}>
                            <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">TT{n}</p>
                            <DateI k={`tt${n}`} disabled={baselineLocked} />
                          </div>
                        ))}
                      </div>
                    </Row>
                    <Row label="Plan to Deliver At"><Text k="plan_deliver" disabled={baselineLocked} /></Row>
                    <Row label="Accompanying Person"><Text k="accompanying" disabled={baselineLocked} /></Row>
                    <Row label="Iodized Salt"><YesNo k="iodized_salt" disabled={baselineLocked} /></Row>
                    <Row label="Iron Supplement"><YesNo k="iron_supplement" disabled={baselineLocked} /></Row>
                    <Row label="Seen by Dentist">
                      <div className="grid gap-2 sm:grid-cols-2"><YesNo k="pre_dentist" disabled={baselineLocked} /><DateI k="pre_dentist_date" disabled={baselineLocked} /></div>
                    </Row>
                    <Row label="Seen by Physician">
                      <div className="grid gap-2 sm:grid-cols-2"><YesNo k="pre_physician" disabled={baselineLocked} /><DateI k="pre_physician_date" disabled={baselineLocked} /></div>
                    </Row>
                    <SubTitle title="Tests (Result / Date)" />
                    {TESTS.map((t) => <TestRow key={`pre_${t.k}`} label={t.label} k={`pre_${t.k}`} disabled={baselineLocked} />)}
                    <Row label="Other Tests, Specify"><Text k="pre_other_tests" disabled={baselineLocked} /></Row>
                  </Section>

                  <p className="rounded-xl bg-[#EFF6FF] px-4 py-2.5 text-xs font-semibold text-[#2563EB]">
                    Monthly prenatal visits (9 months). Fill in a visit and save to unlock the next month.
                  </p>

                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                    const completed = n < prenatalActive;
                    const isActive = n === prenatalActive;
                    const dis = !isActive;
                    return (
                      <div
                        key={n}
                        className={`rounded-2xl border p-4 ${
                          isActive
                            ? "border-[#2563EB] bg-white shadow-sm"
                            : completed
                            ? "border-emerald-200 bg-emerald-50/40"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h4 className="text-sm font-black text-slate-800">
                            Prenatal Visit {n} — Month {n}
                          </h4>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                              completed
                                ? "bg-emerald-100 text-emerald-700"
                                : isActive
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {completed ? "Completed" : isActive ? "Current" : "Locked"}
                          </span>
                        </div>
                        {n > prenatalActive ? (
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                            <Lock className="h-3.5 w-3.5" /> Complete visit {n - 1} first to open this month.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <Row label="Date of Visit"><DateI k={`pn${n}_date`} disabled={dis} /></Row>
                            <Row label="Weight (kg)"><Text k={`pn${n}_weight`} disabled={dis} /></Row>
                            <Row label="Blood Pressure"><Text k={`pn${n}_bp`} disabled={dis} /></Row>
                            <Row label="Fundal Height (cm)"><Text k={`pn${n}_fundal`} disabled={dis} /></Row>
                            <Row label="Fetal Heart Tone"><Text k={`pn${n}_fht`} disabled={dis} /></Row>
                            <Row label="Findings / Remarks"><Text k={`pn${n}_remarks`} disabled={dis} /></Row>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {formTab === "postnatal" && (
                <div className="space-y-4">
                  <Section title="Delivery Details">
                    <Row label="Date of Delivery"><DateI k="post_delivery_date" /></Row>
                    <Row label="Place of Delivery"><Text k="post_place" /></Row>
                    <Row label="Type of Delivery"><Select k="post_type" options={["Normal", "Caesarean Section"]} /></Row>
                    <Row label="Outcome of Pregnancy"><Text k="post_outcome" /></Row>
                    <Row label="Attended By"><Text k="post_attended" /></Row>
                    <Row label="Complications"><Text k="post_complications" /></Row>
                    <Row label="Sex of Newborn"><Select k="post_newborn_sex" options={["Female", "Male"]} /></Row>
                    <Row label="Birthweight"><Text k="post_birthweight" /></Row>
                    <Row label="Hemoglobin">
                      <div className="grid gap-2 sm:grid-cols-2"><YesNo k="post_hemoglobin" /><DateI k="post_hemoglobin_date" /></div>
                    </Row>
                    <Row label="Vitamin A">
                      <div className="grid gap-2 sm:grid-cols-2"><YesNo k="post_vitamin_a" /><DateI k="post_vitamin_a_date" /></div>
                    </Row>
                  </Section>

                  <p className="rounded-xl bg-[#EFF6FF] px-4 py-2.5 text-xs font-semibold text-[#2563EB]">
                    Postnatal visits (Day 0, 3, 7, 42). Fill in a visit and save to unlock the next.
                  </p>

                  {POSTNATAL_DAYS.map((day, idx) => {
                    const completed = idx < postnatalActive;
                    const isActive = idx === postnatalActive;
                    const dis = !isActive;
                    return (
                      <div
                        key={day}
                        className={`rounded-2xl border p-4 ${
                          isActive
                            ? "border-[#2563EB] bg-white shadow-sm"
                            : completed
                            ? "border-emerald-200 bg-emerald-50/40"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h4 className="text-sm font-black text-slate-800">Postnatal Visit — Day {day}</h4>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                              completed
                                ? "bg-emerald-100 text-emerald-700"
                                : isActive
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {completed ? "Completed" : isActive ? "Current" : "Locked"}
                          </span>
                        </div>
                        {idx > postnatalActive ? (
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                            <Lock className="h-3.5 w-3.5" /> Complete the Day {POSTNATAL_DAYS[idx - 1]} visit first.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <Row label="Date of Visit"><DateI k={`postd${day}_date`} disabled={dis} /></Row>
                            <Row label="Blood Pressure"><Text k={`postd${day}_bp`} disabled={dis} /></Row>
                            <Row label="Temperature"><Text k={`postd${day}_temp`} disabled={dis} /></Row>
                            <Row label="Breastfeeding"><YesNo k={`postd${day}_breastfeeding`} disabled={dis} /></Row>
                            <Row label="Counseling"><YesNo k={`postd${day}_counseling`} disabled={dis} /></Row>
                            <Row label="Findings / Remarks"><Text k={`postd${day}_remarks`} disabled={dis} /></Row>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
