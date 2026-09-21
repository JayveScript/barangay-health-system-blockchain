"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Syringe, Save, CheckCircle2 } from "lucide-react";

type Form = Record<string, string>;

const Ctx = createContext<{ form: Form; set: (k: string, v: string) => void; readOnly: boolean }>({
  form: {},
  set: () => {},
  readOnly: false,
});

const fieldCls =
  "min-h-[40px] w-full rounded-xl border border-[#BFDBFE] bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#2563EB] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

function Text({ k, ph }: { k: string; ph?: string }) {
  const { form, set, readOnly } = useContext(Ctx);
  return <input value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} placeholder={ph} disabled={readOnly} className={fieldCls} />;
}
function DateI({ k }: { k: string }) {
  const { form, set, readOnly } = useContext(Ctx);
  return <input type="date" value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} disabled={readOnly} className={fieldCls} />;
}
function Check({ k, label }: { k: string; label: string }) {
  const { form, set, readOnly } = useContext(Ctx);
  const on = form[k] === "Yes";
  return (
    <button
      type="button"
      disabled={readOnly}
      onClick={() => set(k, on ? "" : "Yes")}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70 ${
        on ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-[#BFDBFE] bg-white text-slate-600 hover:bg-[#EFF6FF]"
      }`}
    >
      <span className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] font-black ${on ? "border-white bg-white text-[#2563EB]" : "border-slate-300 bg-white"}`}>{on ? "✓" : ""}</span>
      {label}
    </button>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[200px_1fr] sm:items-center sm:gap-2">
      <label className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</label>
      <div>{children}</div>
    </div>
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

// EPI schedule: which age columns are applicable (a date can be entered) per vaccine.
const AGES: [string, string][] = [
  ["24hrs", "24 hrs"], ["6wks", "6 wks"], ["10wks", "10 wks"],
  ["14wks", "14 wks"], ["9mos", "9 mos"], ["12mos", "12 mos"], ["12plus", "12 mos & above"],
];
const VACCINES: { key: string; label: string; ages: string[] }[] = [
  { key: "bcg", label: "BCG (Bacillus-Calmette-Guérin)", ages: ["24hrs"] },
  { key: "hepb", label: "Hepatitis B", ages: ["24hrs"] },
  { key: "penta", label: "PENTA (DTwP-HepB-Hib)", ages: ["6wks", "10wks", "14wks"] },
  { key: "pcv", label: "PCV (Pneumococcal Conjugate)", ages: ["6wks", "10wks", "14wks"] },
  { key: "opv", label: "OPV (Oral Polio Vaccine)", ages: ["6wks", "10wks", "14wks"] },
  { key: "ipv", label: "IPV (Inactivated Polio Vaccine)", ages: ["14wks", "9mos"] },
  { key: "mmr", label: "MMR (Measles-Mumps-Rubella)", ages: ["9mos", "12mos"] },
];

export function ImmunizationTab({
  residentId,
  readOnly = false,
  endpoint,
}: {
  residentId: string;
  age?: number;
  readOnly?: boolean;
  endpoint?: string;
}) {
  const getUrl = endpoint || `/api/immunization/${residentId}`;
  const [form, setForm] = useState<Form>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const set = useCallback((k: string, v: string) => setForm((p) => ({ ...p, [k]: v })), []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(getUrl, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) setForm(json.data as Form);
      } catch {
        setErr("Unable to load immunization record.");
      } finally {
        setLoading(false);
      }
    })();
  }, [getUrl]);

  const save = async () => {
    try {
      setSaving(true);
      setErr("");
      setMsg("");
      const res = await fetch(`/api/immunization/${residentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: form }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error || "Failed to save.");
        return;
      }
      setMsg("Immunization record saved.");
      setTimeout(() => setMsg(""), 2500);
    } catch {
      setErr("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[160px] items-center justify-center gap-3 text-sm font-semibold text-[#2563EB]">
        <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#DBEAFE] border-t-[#2563EB]" />
        Loading immunization...
      </div>
    );
  }

  return (
    <Ctx.Provider value={{ form, set, readOnly }}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-xs font-semibold text-[#1E3A8A]">
          Child Immunization Record (ITR) — for children 5 years old and below.
        </div>

        <Section title="Birth & Health History of Child">
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Time of Birth"><Text k="imm_time_birth" ph="e.g. 08:30 AM" /></Row>
            <Row label="Birth Weight (kg)"><Text k="imm_birth_weight" ph="kg" /></Row>
            <Row label="Birth Facility"><Text k="imm_birth_facility" /></Row>
            <Row label="Ballard's Score"><Text k="imm_ballard" /></Row>
            <Row label="Attendant at Birth"><Text k="imm_attendant" /></Row>
            <Row label="Type of Delivery"><Text k="imm_delivery_type" ph="Normal / Cesarean" /></Row>
            <Row label="Date of Hearing Test"><DateI k="imm_hearing_date" /></Row>
            <Row label="Date of NHS"><DateI k="imm_nhs_date" /></Row>
            <Row label="NHS Result"><Text k="imm_nhs_result" /></Row>
          </div>
        </Section>

        <Section title="Immunization Schedule (date given)">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-xs">
              <thead>
                <tr className="bg-[#EFF6FF] text-[#1E3A8A]">
                  <th className="sticky left-0 z-10 bg-[#EFF6FF] px-3 py-2 text-left font-black uppercase">Vaccine</th>
                  {AGES.map(([k, l]) => (
                    <th key={k} className="px-2 py-2 text-center font-black uppercase">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VACCINES.map((v) => (
                  <tr key={v.key} className="border-t border-slate-100">
                    <td className="sticky left-0 z-10 bg-white px-3 py-2 font-bold text-slate-700">{v.label}</td>
                    {AGES.map(([ak]) => {
                      const applicable = v.ages.includes(ak);
                      const key = `imm_${v.key}_${ak}`;
                      return (
                        <td key={ak} className={`px-1.5 py-1.5 ${applicable ? "" : "bg-slate-100"}`}>
                          {applicable ? (
                            <DateI k={key} />
                          ) : (
                            <span className="block text-center text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {[1, 2, 3].map((n) => (
                  <tr key={`other${n}`} className="border-t border-slate-100">
                    <td className="sticky left-0 z-10 bg-white px-3 py-2">
                      <Text k={`imm_other${n}_name`} ph={`Other vaccine ${n}`} />
                    </td>
                    {AGES.map(([ak]) => (
                      <td key={ak} className="px-1.5 py-1.5"><DateI k={`imm_other${n}_${ak}`} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Check k="imm_fic" label="FIC — Fully Immunized Child" />
            <Check k="imm_cic" label="CIC — Completely Immunized Child" />
          </div>
        </Section>

        {readOnly ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
            Read-only view — this immunization record is filled in by your health workers.
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">
              {err && <span className="font-semibold text-red-600">{err}</span>}
              {msg && (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {msg}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-2xl bg-[#2563EB] px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Immunization"}
            </button>
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
