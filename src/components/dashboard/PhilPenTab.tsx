"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { HeartPulse, Save, CheckCircle2, ShieldAlert } from "lucide-react";

type Form = Record<string, string>;

const Ctx = createContext<{ form: Form; set: (k: string, v: string) => void; readOnly: boolean }>({
  form: {},
  set: () => {},
  readOnly: false,
});

const fieldCls =
  "min-h-[42px] w-full rounded-xl border border-[#BFDBFE] bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#2563EB] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

function Text({ k, ph }: { k: string; ph?: string }) {
  const { form, set, readOnly } = useContext(Ctx);
  return <input value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} placeholder={ph} disabled={readOnly} className={fieldCls} />;
}
function DateI({ k }: { k: string }) {
  const { form, set, readOnly } = useContext(Ctx);
  return <input type="date" value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} disabled={readOnly} className={fieldCls} />;
}
function ReadOnly({ value }: { value: string }) {
  return (
    <div className="flex min-h-[42px] items-center rounded-xl border border-[#BFDBFE] bg-slate-100 px-3 text-sm font-bold text-slate-600">
      {value || "—"}
    </div>
  );
}
function YesNo({ k, options = ["Yes", "No"] }: { k: string; options?: string[] }) {
  const { form, set, readOnly } = useContext(Ctx);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={readOnly}
          onClick={() => set(k, form[k] === opt ? "" : opt)}
          className={`min-h-[42px] flex-1 rounded-xl border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70 ${
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
function Check({ k, label }: { k: string; label: string }) {
  const { form, set, readOnly } = useContext(Ctx);
  const on = form[k] === "Yes";
  return (
    <button
      type="button"
      disabled={readOnly}
      onClick={() => set(k, on ? "" : "Yes")}
      className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
        on ? "border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]" : "border-[#BFDBFE] bg-white text-slate-600 hover:bg-[#F8FAFC]"
      }`}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-black ${
          on ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-slate-300 bg-white"
        }`}
      >
        {on ? "✓" : ""}
      </span>
      <span className="min-w-0">{label}</span>
    </button>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[240px_1fr] sm:items-center sm:gap-2">
      <label className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</label>
      <div>{children}</div>
    </div>
  );
}
function TestRow({ label, k, unit }: { label: string; k: string; unit?: string }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[200px_1fr_150px] sm:items-center sm:gap-2">
      <label className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</label>
      <Text k={`${k}_result`} ph={unit ? `Result (${unit})` : "Result"} />
      <DateI k={`${k}_date`} />
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

function bmiOf(w: string, h: string): { bmi: string; cls: string } {
  const kg = parseFloat(w);
  const cm = parseFloat(h);
  if (!Number.isFinite(kg) || !Number.isFinite(cm) || cm <= 0) return { bmi: "", cls: "" };
  const m = cm / 100;
  const bmi = kg / (m * m);
  if (!Number.isFinite(bmi) || bmi <= 0) return { bmi: "", cls: "" };
  const cls =
    bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  return { bmi: bmi.toFixed(1), cls };
}
function avgBp(a: string, b: string): string {
  const pa = a.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  const pb = b.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (!pa || !pb) return "";
  const sys = Math.round((+pa[1] + +pb[1]) / 2);
  const dia = Math.round((+pa[2] + +pb[2]) / 2);
  return `${sys}/${dia}`;
}

export function PhilPenTab({
  residentId,
  readOnly = false,
  endpoint,
}: {
  residentId: string;
  residentName?: string;
  age?: number;
  readOnly?: boolean;
  endpoint?: string;
}) {
  const getUrl = endpoint || `/api/philpen/${residentId}`;
  const [form, setForm] = useState<Form>({});
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const set = useCallback((k: string, v: string) => setForm((p) => ({ ...p, [k]: v })), []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (!readOnly) {
          const meRes = await fetch("/api/users/me", { cache: "no-store" });
          const me = await meRes.json().catch(() => ({}));
          setRole(String(me?.role || ""));
        }
        const recRes = await fetch(getUrl, { cache: "no-store" });
        const rec = await recRes.json().catch(() => ({}));
        if (recRes.ok && rec?.data) setForm(rec.data as Form);
      } catch {
        setErr("Unable to load PhilPEN record.");
      } finally {
        setLoading(false);
      }
    })();
  }, [getUrl, readOnly]);

  // Which parts this role may see. Part I: BHW/Midwife/Nurse. Part II: Nurse/Doctor.
  const parts: ("I" | "II")[] =
    role === "BHW" || role === "MIDWIFE"
      ? ["I"]
      : role === "DOCTOR"
      ? ["II"]
      : ["I", "II"]; // NURSE + admins see both
  const [part, setPart] = useState<"I" | "II">("I");
  useEffect(() => {
    if (parts.length && !parts.includes(part)) setPart(parts[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const save = async () => {
    try {
      setSaving(true);
      setErr("");
      setMsg("");
      const { bmi, cls } = bmiOf(form.p1_weight ?? "", form.p1_height ?? "");
      const payload = {
        ...form,
        p1_bmi: bmi,
        p1_bmi_class: cls,
        p1_bp_avg: avgBp(form.p1_bp2 ?? "", form.p1_bp3 ?? ""),
        p2_bp_avg: avgBp(form.p2_bp2 ?? "", form.p2_bp3 ?? ""),
      };
      const res = await fetch(`/api/philpen/${residentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error || "Failed to save.");
        return;
      }
      setForm(payload);
      setMsg("PhilPEN record saved.");
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
        Loading PhilPEN...
      </div>
    );
  }

  const { bmi, cls } = bmiOf(form.p1_weight ?? "", form.p1_height ?? "");
  const p1HighRisk = form.p1_hx_cvd === "Yes";
  const p2HighRisk = ["p2_c_angina", "p2_c_lvh", "p2_c_chol", "p2_c_bp", "p2_c_dm_neph", "p2_c_renal"].some(
    (k) => form[k] === "Yes"
  );

  return (
    <Ctx.Provider value={{ form, set, readOnly }}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-xs font-semibold text-[#1E3A8A]">
          PhilPEN — Philippine Package of Essential NCD Interventions. Shown for residents 20 years and older.
        </div>

        {/* Part switcher (roles) */}
        {parts.length > 1 && (
          <div className="flex gap-1 rounded-2xl bg-[#DBEAFE] p-1.5">
            {parts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPart(p)}
                className={`flex-1 rounded-xl px-2 py-2.5 text-[11px] font-black uppercase tracking-wide transition sm:text-xs ${
                  part === p ? "bg-[#2563EB] text-white shadow-sm" : "text-slate-600 hover:bg-white"
                }`}
              >
                {p === "I" ? "Part I — BHW / Midwife / Nurse" : "Part II — Nurse / Doctor"}
              </button>
            ))}
          </div>
        )}

        {part === "I" && parts.includes("I") && (
          <>
            <Section title="Part I — Assessment (BHW / Midwife / Nurse)">
              <div className="grid gap-3 sm:grid-cols-2">
                <Row label="Weight (kg)"><Text k="p1_weight" ph="kg" /></Row>
                <Row label="Height (cm)"><Text k="p1_height" ph="cm" /></Row>
                <Row label="Body Mass Index (BMI)"><ReadOnly value={bmi} /></Row>
                <Row label="BMI Classification"><ReadOnly value={cls} /></Row>
                <Row label="Waist Circumference (cm)"><Text k="p1_waist" ph="cm" /></Row>
              </div>
            </Section>

            <Section title="Risk History">
              <Row label="History of heart attack, stroke, or chronic kidney problem?"><YesNo k="p1_hx_cvd" /></Row>
              {p1HighRisk && (
                <p className="flex items-center gap-1.5 text-xs font-black uppercase text-red-600">
                  <ShieldAlert className="h-4 w-4" /> Automatic HIGH RISK (&gt;20%) — prior CVD or chronic kidney problem
                </p>
              )}
              <Row label="Heart attack / stroke in a first-degree relative"><YesNo k="p1_hx_relative" /></Row>
              <Row label="Diabetes Mellitus"><YesNo k="p1_dm" options={["Yes", "No", "I don't know"]} /></Row>
              <Row label="If diabetic, taking medications?"><YesNo k="p1_dm_meds" /></Row>
              <Row label="Hypertension"><YesNo k="p1_htn" options={["Yes", "No", "I don't know"]} /></Row>
              <Row label="If hypertensive, taking medications?"><YesNo k="p1_htn_meds" /></Row>
              <Row label="High Cholesterol"><YesNo k="p1_chol" options={["Yes", "No", "I don't know"]} /></Row>
              <Row label="If high cholesterol, taking medications?"><YesNo k="p1_chol_meds" /></Row>
            </Section>

            <Section title="Blood Pressure (1st encounter)">
              <div className="grid gap-3 sm:grid-cols-2">
                <Row label="1st Reading (mmHg)"><Text k="p1_bp1" ph="e.g. 120/80" /></Row>
                <Row label="2nd Reading (mmHg)"><Text k="p1_bp2" ph="e.g. 120/80" /></Row>
                <Row label="3rd Reading (mmHg)"><Text k="p1_bp3" ph="e.g. 120/80" /></Row>
                <Row label="Average of 2nd & 3rd"><ReadOnly value={avgBp(form.p1_bp2 ?? "", form.p1_bp3 ?? "")} /></Row>
              </div>
            </Section>

            <Section title="Lifestyle">
              <Row label="Current Smoker"><YesNo k="p1_smoker" /></Row>
              <Row label="Binge Drinking in the past year"><YesNo k="p1_binge" /></Row>
              <Row label="Moderate/vigorous physical activity ≥150 min/week"><YesNo k="p1_activity" /></Row>
              <Row label="Intake of fruits & vegetables below five portions"><YesNo k="p1_lowfruit" /></Row>
            </Section>

            <Section title="Management">
              <p className="text-xs font-semibold text-slate-500">Counselling on / referral:</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Check k="p1_mgmt_diet" label="Healthy Diet" />
                <Check k="p1_mgmt_activity" label="Physical Activity" />
                <Check k="p1_mgmt_bti" label="Referred for BTI" />
                <Check k="p1_mgmt_alcohol" label="Harmful use of Alcohol" />
              </div>
              <Row label="Date of Next Risk Assessment"><DateI k="p1_next_assessment" /></Row>
              <div className="grid gap-3 sm:grid-cols-2">
                <Row label="Assessed by"><Text k="p1_assessed_by" ph="Name" /></Row>
                <Row label="Verified by"><Text k="p1_verified_by" ph="Name" /></Row>
              </div>
            </Section>
          </>
        )}

        {part === "II" && parts.includes("II") && (
          <>
            <Section title="Part II — For Nurses or Doctors only">
              <p className="text-xs font-semibold text-slate-500">Does the individual have any of the following?</p>
              <div className="grid gap-2">
                <Check k="p2_c_angina" label="Established angina pectoris, CHD, MI, TIA, stroke, PVD, or coronary revascularization / carotid endarterectomy" />
                <Check k="p2_c_lvh" label="Left ventricular hypertrophy (ECG) or hypertensive retinopathy (grade III or IV)" />
                <Check k="p2_c_chol" label="Without established CVD: total cholesterol ≥8 mmol/L (320 mg/dL), LDL ≥6 mmol/L (240 mg/dL), or TC/HDL ratio > 8" />
                <Check k="p2_c_bp" label="Without established CVD: persistent raised BP (> 160-170 / 100-105 mmHg)" />
                <Check k="p2_c_dm_neph" label="Type 1 or 2 diabetes with overt nephropathy or other significant renal disease" />
                <Check k="p2_c_renal" label="Known renal failure or renal impairment, or on dialysis" />
              </div>
              {p2HighRisk && (
                <p className="flex items-center gap-1.5 text-xs font-black uppercase text-red-600">
                  <ShieldAlert className="h-4 w-4" /> Automatic HIGH RISK (&gt;20%) from a cardiovascular event or high individual risk factors
                </p>
              )}
            </Section>

            <Section title="Blood Pressure (1st encounter)">
              <div className="grid gap-3 sm:grid-cols-2">
                <Row label="1st Reading (mmHg)"><Text k="p2_bp1" ph="e.g. 120/80" /></Row>
                <Row label="2nd Reading (mmHg)"><Text k="p2_bp2" ph="e.g. 120/80" /></Row>
                <Row label="3rd Reading (mmHg)"><Text k="p2_bp3" ph="e.g. 120/80" /></Row>
                <Row label="Average of 2nd & 3rd"><ReadOnly value={avgBp(form.p2_bp2 ?? "", form.p2_bp3 ?? "")} /></Row>
              </div>
            </Section>

            <Section title="Blood Sugar">
              <Row label="Classic symptoms of marked hyperglycemia (polyuria, polydipsia, weight loss)"><YesNo k="p2_hyperglycemia" /></Row>
              <TestRow label="Random Plasma Glucose (RPG)" k="p2_rpg" unit="mg/dL" />
              <TestRow label="Fasting Plasma Glucose (FPG)" k="p2_fpg" unit="mg/dL" />
              <TestRow label="Confirmatory FPG" k="p2_fpg_conf" unit="mg/dL" />
              <TestRow label="Urine Ketones" k="p2_ketones" />
              <TestRow label="Total Cholesterol" k="p2_totchol" unit="mmol/L" />
            </Section>

            <Section title="Basic Laboratory Tests (Confirmed Hypertensives)">
              <div className="grid gap-2 sm:grid-cols-3">
                <Check k="p2_lab_ecg" label="12-L ECG" />
                <Check k="p2_lab_bloods" label="Blood tests: creatinine, eGFR, sodium, potassium, lipid profile, FPG" />
                <Check k="p2_lab_dipstick" label="Dipstick urine or urinary albumin/creatinine ratio" />
              </div>
            </Section>

            <Section title="Management">
              <Row label="Anti-hypertensives"><YesNo k="p2_med_antihtn" /></Row>
              <Row label="Oral hypoglycemic agents / Insulin"><YesNo k="p2_med_oha" /></Row>
              <Row label="Medication source"><YesNo k="p2_med_provided" options={["Provided by facility", "Out of pocket"]} /></Row>
              <Row label="Date of Follow-up"><DateI k="p2_followup" /></Row>
              <Row label="Physician's Name"><Text k="p2_physician" ph="Physician name" /></Row>
            </Section>
          </>
        )}

        {readOnly ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
            Read-only view — this PhilPEN assessment is filled in by your health workers.
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
              {saving ? "Saving..." : "Save PhilPEN"}
            </button>
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
