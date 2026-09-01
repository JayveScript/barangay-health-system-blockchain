"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  UserPlus,
  X,
} from "lucide-react";
import {
  EDUCATIONAL_ATTAINMENT_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/lib/barangay-options";

type ResidentRegistrationForm = {
  lastName: string;
  firstName: string;
  middleName: string;
  age: string;
  sex: "MALE" | "FEMALE" | "";
  isPregnant: boolean | null;
  birthDate: string;
  religion: string;
  houseStreet: string;
  completeAddress: string;
  civilStatus:
    | "SINGLE"
    | "MARRIED"
    | "WIDOWED"
    | "ANNULLED"
    | "SEPARATED"
    | "COHABITANT"
    | "";
  contactNumber: string;
  educationalAttainment: string;
  occupation: string;
  accompanyingPerson: string;
  relationship: string;
  spouseMaidenName: string;
  spouseOccupation: string;
  spouseContactNumber: string;
  hasHypertension: boolean;
  hasDiabetes: boolean;
  hasStiHiv: boolean;
  hasHeartDisease: boolean;
  hasKidneyFailure: boolean;
  hasTuberculosis: boolean;
  hasAllergies: boolean;
  allergiesDetails: string;
  hasCancer: boolean;
  cancerDetails: string;
  hasOtherConditions: boolean;
  otherConditionsDetails: string;
  maintenanceMedications: string;
  previousIllnessesSurgeries: string;
  familyAsthmaAllergies: boolean;
  familyBirthDefects: boolean;
  familyCancer: boolean;
  familyDementia: boolean;
  familyDiabetes: boolean;
  familyHypertension: boolean;
  familyKidneyDisease: boolean;
  familyMentalIllness: boolean;
  eatsHealthyDiet: boolean;
  adequatePhysicalActivity: boolean;
  sufficientRestSleep: boolean;
  normalGrowthDevelopment: boolean;
  multipleSexPartners: boolean;
  smokesTobacco: boolean;
  tobaccoPacksPerYear: string;
  drinksAlcohol: boolean;
  alcoholBottlesPerDay: string;
  takesIllicitDrugs: boolean;
  illicitDrugsDetails: string;
};

const stepLabels = [
  "Identifying Data",
  "Past Medical History",
  "Family History",
  "Personal / Social History",
  "Review Summary",
];

const initialForm: ResidentRegistrationForm = {
  lastName: "",
  firstName: "",
  middleName: "",
  age: "",
  sex: "",
  isPregnant: null,
  birthDate: "",
  religion: "",
  houseStreet: "",
  completeAddress: "",
  civilStatus: "",
  contactNumber: "",
  educationalAttainment: "",
  occupation: "",
  accompanyingPerson: "",
  relationship: "",
  spouseMaidenName: "",
  spouseOccupation: "",
  spouseContactNumber: "",
  hasHypertension: false,
  hasDiabetes: false,
  hasStiHiv: false,
  hasHeartDisease: false,
  hasKidneyFailure: false,
  hasTuberculosis: false,
  hasAllergies: false,
  allergiesDetails: "",
  hasCancer: false,
  cancerDetails: "",
  hasOtherConditions: false,
  otherConditionsDetails: "",
  maintenanceMedications: "",
  previousIllnessesSurgeries: "",
  familyAsthmaAllergies: false,
  familyBirthDefects: false,
  familyCancer: false,
  familyDementia: false,
  familyDiabetes: false,
  familyHypertension: false,
  familyKidneyDisease: false,
  familyMentalIllness: false,
  eatsHealthyDiet: false,
  adequatePhysicalActivity: false,
  sufficientRestSleep: false,
  normalGrowthDevelopment: false,
  multipleSexPartners: false,
  smokesTobacco: false,
  tobaccoPacksPerYear: "",
  drinksAlcohol: false,
  alcoholBottlesPerDay: "",
  takesIllicitDrugs: false,
  illicitDrugsDetails: "",
};

export function ResidentRegistrationTab({
  barangayName,
}: {
  barangayName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5 pb-4">
      <div className="rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <UserPlus className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Resident Registration
            </h2>
            <p className="text-sm text-slate-500">
              Register walk-in residents without account verification.
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-sky-200 bg-[#EFF6FF] p-5">
          <h3 className="text-2xl font-extrabold text-slate-900">
            New Resident Entry
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            This flow uses the same health registration structure but removes Step
            5. You can directly save to the database.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-5 inline-flex min-h-[50px] items-center gap-2 rounded-2xl bg-[#0EA5E9] px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-600"
          >
            <UserPlus className="h-4 w-4" />
            Open Registration Form
          </button>
        </div>
      </div>

      {open && (
        <RegistrationModal
          barangayName={barangayName}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function RegistrationModal({
  barangayName,
  onClose,
}: {
  barangayName: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<ResidentRegistrationForm>(initialForm);

  const updateField = <K extends keyof ResidentRegistrationForm>(
    key: K,
    value: ResidentRegistrationForm[K]
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      next.completeAddress = [next.houseStreet.trim(), barangayName, "Davao City"]
        .filter(Boolean)
        .join(", ");
      return next;
    });
  };

  const computeAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? String(age) : "";
  };

  const validateStep = () => {
    if (step !== 1) return true;
    if (!form.lastName || !form.firstName || !form.birthDate || !form.sex || !form.civilStatus) {
      setError("Please complete required fields in Step 1.");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    setError("");
    if (!validateStep()) return;
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setError("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const submit = async () => {
    setError("");
    setMessage("");
    if (!validateStep()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/staff/resident-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          completeAddress: form.completeAddress,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to register resident.");
        return;
      }

      setMessage("Resident registered successfully.");
      setForm(initialForm);
      setStep(1);
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:p-4">
      <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden border border-sky-200 bg-white shadow-2xl sm:h-[92vh] sm:rounded-[30px]">
        <div className="flex items-center justify-between border-b border-sky-200 bg-sky-50/60 p-4 sm:p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-sky-600">
              Resident Registration
            </p>
            <h3 className="text-2xl font-black text-slate-900">
              {stepLabels[step - 1]}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white p-2 text-slate-600 ring-1 ring-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-sky-100 px-5 py-3">
          <div className="grid gap-2 md:grid-cols-4">
            {stepLabels.map((label, idx) => {
              const current = idx + 1;
              const active = current === step;
              const done = current < step;
              return (
                <div
                  key={label}
                  className={`rounded-xl border px-3 py-2 ${
                    active ? "border-sky-500 bg-sky-50" : done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        active ? "bg-sky-500 text-white" : done ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : current}
                    </span>
                    <span className="truncate text-xs font-bold text-slate-700">{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <ModalInput label="Last Name *" value={form.lastName} onChange={(v) => updateField("lastName", v)} />
              <ModalInput label="First Name *" value={form.firstName} onChange={(v) => updateField("firstName", v)} />
              <ModalInput label="Middle Name" value={form.middleName} onChange={(v) => updateField("middleName", v)} />
              <ModalInput label="Birthday *" type="date" value={form.birthDate} onChange={(v) => {
                updateField("birthDate", v);
                updateField("age", computeAge(v));
              }} />
              <ModalInput label="Age" value={form.age} onChange={(v) => updateField("age", v)} />
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Sex *</label>
                <select
                  value={form.sex}
                  onChange={(e) => {
                    const value = e.target.value as ResidentRegistrationForm["sex"];
                    setForm((prev) => ({
                      ...prev,
                      sex: value,
                      isPregnant: value === "FEMALE" ? prev.isPregnant : null,
                    }));
                  }}
                  className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none"
                >
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              {form.sex === "FEMALE" && (
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Pregnant?</label>
                  <select
                    value={form.isPregnant === null ? "" : form.isPregnant ? "yes" : "no"}
                    onChange={(e) =>
                      updateField(
                        "isPregnant",
                        e.target.value === "" ? null : e.target.value === "yes"
                      )
                    }
                    className="min-h-[48px] w-full rounded-2xl border border-pink-200 bg-pink-50/40 px-4 text-sm font-semibold text-slate-900 outline-none"
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes, Pregnant</option>
                    <option value="no">No</option>
                  </select>
                </div>
              )}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Civil Status *</label>
                <select
                  value={form.civilStatus}
                  onChange={(e) => updateField("civilStatus", e.target.value as ResidentRegistrationForm["civilStatus"])}
                  className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none"
                >
                  <option value="">Select</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="WIDOWED">Widowed</option>
                  <option value="ANNULLED">Annulled</option>
                  <option value="SEPARATED">Separated</option>
                  <option value="COHABITANT">Co-habitant</option>
                </select>
              </div>
              <ModalInput label="House / Street" value={form.houseStreet} onChange={(v) => updateField("houseStreet", v)} />
              <ModalInput label="Contact Number" value={form.contactNumber} onChange={(v) => updateField("contactNumber", v)} />
              <ModalInput label="Religion" value={form.religion} onChange={(v) => updateField("religion", v)} />
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Educational Attainment</label>
                <select
                  value={form.educationalAttainment}
                  onChange={(e) => updateField("educationalAttainment", e.target.value)}
                  className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none"
                >
                  <option value="">Select</option>
                  {EDUCATIONAL_ATTAINMENT_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <ModalInput label="Occupation" value={form.occupation} onChange={(v) => updateField("occupation", v)} />
              <ModalInput label="Accompanying Person" value={form.accompanyingPerson} onChange={(v) => updateField("accompanyingPerson", v)} />
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Relationship</label>
                <select
                  value={form.relationship}
                  onChange={(e) => updateField("relationship", e.target.value)}
                  className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none"
                >
                  <option value="">Select</option>
                  {RELATIONSHIP_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <ModalCheckGrid>
                <ModalCheck label="Hypertension" checked={form.hasHypertension} onChange={(v) => updateField("hasHypertension", v)} />
                <ModalCheck label="Diabetes" checked={form.hasDiabetes} onChange={(v) => updateField("hasDiabetes", v)} />
                <ModalCheck label="STI / HIV" checked={form.hasStiHiv} onChange={(v) => updateField("hasStiHiv", v)} />
                <ModalCheck label="Heart Disease" checked={form.hasHeartDisease} onChange={(v) => updateField("hasHeartDisease", v)} />
                <ModalCheck label="Kidney Failure" checked={form.hasKidneyFailure} onChange={(v) => updateField("hasKidneyFailure", v)} />
                <ModalCheck label="Tuberculosis" checked={form.hasTuberculosis} onChange={(v) => updateField("hasTuberculosis", v)} />
              </ModalCheckGrid>
              <ModalToggleText label="Allergies" checked={form.hasAllergies} onToggle={(v) => updateField("hasAllergies", v)} value={form.allergiesDetails} onChange={(v) => updateField("allergiesDetails", v)} />
              <ModalToggleText label="Cancer" checked={form.hasCancer} onToggle={(v) => updateField("hasCancer", v)} value={form.cancerDetails} onChange={(v) => updateField("cancerDetails", v)} />
              <ModalToggleText label="Other Conditions" checked={form.hasOtherConditions} onToggle={(v) => updateField("hasOtherConditions", v)} value={form.otherConditionsDetails} onChange={(v) => updateField("otherConditionsDetails", v)} />
              <ModalTextArea label="Maintenance Medications" value={form.maintenanceMedications} onChange={(v) => updateField("maintenanceMedications", v)} />
              <ModalTextArea label="Previous Illnesses / Surgeries" value={form.previousIllnessesSurgeries} onChange={(v) => updateField("previousIllnessesSurgeries", v)} />
            </div>
          )}

          {step === 3 && (
            <ModalCheckGrid>
              <ModalCheck label="Asthma / Allergies" checked={form.familyAsthmaAllergies} onChange={(v) => updateField("familyAsthmaAllergies", v)} />
              <ModalCheck label="Birth Defects" checked={form.familyBirthDefects} onChange={(v) => updateField("familyBirthDefects", v)} />
              <ModalCheck label="Cancer" checked={form.familyCancer} onChange={(v) => updateField("familyCancer", v)} />
              <ModalCheck label="Dementia" checked={form.familyDementia} onChange={(v) => updateField("familyDementia", v)} />
              <ModalCheck label="Diabetes" checked={form.familyDiabetes} onChange={(v) => updateField("familyDiabetes", v)} />
              <ModalCheck label="Hypertension" checked={form.familyHypertension} onChange={(v) => updateField("familyHypertension", v)} />
              <ModalCheck label="Kidney Disease" checked={form.familyKidneyDisease} onChange={(v) => updateField("familyKidneyDisease", v)} />
              <ModalCheck label="Mental Illness" checked={form.familyMentalIllness} onChange={(v) => updateField("familyMentalIllness", v)} />
            </ModalCheckGrid>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <ModalCheckGrid>
                <ModalCheck label="Eats Healthy Diet" checked={form.eatsHealthyDiet} onChange={(v) => updateField("eatsHealthyDiet", v)} />
                <ModalCheck label="Adequate Physical Activity" checked={form.adequatePhysicalActivity} onChange={(v) => updateField("adequatePhysicalActivity", v)} />
                <ModalCheck label="Sufficient Rest / Sleep" checked={form.sufficientRestSleep} onChange={(v) => updateField("sufficientRestSleep", v)} />
                <ModalCheck label="Normal Growth Development" checked={form.normalGrowthDevelopment} onChange={(v) => updateField("normalGrowthDevelopment", v)} />
                <ModalCheck label="Multiple Sex Partners" checked={form.multipleSexPartners} onChange={(v) => updateField("multipleSexPartners", v)} />
              </ModalCheckGrid>
              <ModalToggleText label="Smokes Tobacco" checked={form.smokesTobacco} onToggle={(v) => updateField("smokesTobacco", v)} value={form.tobaccoPacksPerYear} onChange={(v) => updateField("tobaccoPacksPerYear", v)} />
              <ModalToggleText label="Drinks Alcohol" checked={form.drinksAlcohol} onToggle={(v) => updateField("drinksAlcohol", v)} value={form.alcoholBottlesPerDay} onChange={(v) => updateField("alcoholBottlesPerDay", v)} />
              <ModalToggleText label="Takes Illicit Drugs" checked={form.takesIllicitDrugs} onToggle={(v) => updateField("takesIllicitDrugs", v)} value={form.illicitDrugsDetails} onChange={(v) => updateField("illicitDrugsDetails", v)} />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-600">
                Review all details before final submit.
              </div>

              <SummaryCard title="Identifying Data">
                <SummaryItem
                  label="Full Name"
                  value={`${form.firstName} ${form.middleName} ${form.lastName}`
                    .replace(/\s+/g, " ")
                    .trim()}
                />
                <SummaryItem label="Birthday" value={form.birthDate} />
                <SummaryItem label="Age" value={form.age} />
                <SummaryItem label="Sex" value={form.sex} />
                <SummaryItem label="Civil Status" value={form.civilStatus} />
                <SummaryItem label="Religion" value={form.religion} />
                <SummaryItem label="Contact Number" value={form.contactNumber} />
                <SummaryItem label="Address" value={form.completeAddress} />
              </SummaryCard>

              <SummaryCard title="Past Medical History">
                <SummaryItem label="Hypertension" value={yesNoText(form.hasHypertension)} />
                <SummaryItem label="Diabetes" value={yesNoText(form.hasDiabetes)} />
                <SummaryItem label="STI / HIV" value={yesNoText(form.hasStiHiv)} />
                <SummaryItem label="Heart Disease" value={yesNoText(form.hasHeartDisease)} />
                <SummaryItem label="Kidney Failure" value={yesNoText(form.hasKidneyFailure)} />
                <SummaryItem label="Tuberculosis" value={yesNoText(form.hasTuberculosis)} />
                <SummaryItem label="Allergies" value={yesNoText(form.hasAllergies)} />
                <SummaryItem label="Allergies Details" value={form.allergiesDetails} />
                <SummaryItem label="Cancer" value={yesNoText(form.hasCancer)} />
                <SummaryItem label="Cancer Details" value={form.cancerDetails} />
                <SummaryItem label="Other Conditions" value={yesNoText(form.hasOtherConditions)} />
                <SummaryItem label="Other Conditions Details" value={form.otherConditionsDetails} />
                <SummaryItem label="Maintenance Medications" value={form.maintenanceMedications} />
                <SummaryItem label="Previous Illnesses / Surgeries" value={form.previousIllnessesSurgeries} />
              </SummaryCard>

              <SummaryCard title="Family History">
                <SummaryItem label="Asthma / Allergies" value={yesNoText(form.familyAsthmaAllergies)} />
                <SummaryItem label="Birth Defects" value={yesNoText(form.familyBirthDefects)} />
                <SummaryItem label="Cancer" value={yesNoText(form.familyCancer)} />
                <SummaryItem label="Dementia" value={yesNoText(form.familyDementia)} />
                <SummaryItem label="Diabetes" value={yesNoText(form.familyDiabetes)} />
                <SummaryItem label="Hypertension" value={yesNoText(form.familyHypertension)} />
                <SummaryItem label="Kidney Disease" value={yesNoText(form.familyKidneyDisease)} />
                <SummaryItem label="Mental Illness" value={yesNoText(form.familyMentalIllness)} />
              </SummaryCard>

              <SummaryCard title="Personal / Social History">
                <SummaryItem label="Eats Healthy Diet" value={yesNoText(form.eatsHealthyDiet)} />
                <SummaryItem label="Adequate Physical Activity" value={yesNoText(form.adequatePhysicalActivity)} />
                <SummaryItem label="Sufficient Rest / Sleep" value={yesNoText(form.sufficientRestSleep)} />
                <SummaryItem label="Normal Growth Development" value={yesNoText(form.normalGrowthDevelopment)} />
                <SummaryItem label="Multiple Sex Partners" value={yesNoText(form.multipleSexPartners)} />
                <SummaryItem label="Smokes Tobacco" value={yesNoText(form.smokesTobacco)} />
                <SummaryItem label="Tobacco Packs / Year" value={form.tobaccoPacksPerYear} />
                <SummaryItem label="Drinks Alcohol" value={yesNoText(form.drinksAlcohol)} />
                <SummaryItem label="Alcohol Bottles / Day" value={form.alcoholBottlesPerDay} />
                <SummaryItem label="Takes Illicit Drugs" value={yesNoText(form.takesIllicitDrugs)} />
                <SummaryItem label="Illicit Drug Details" value={form.illicitDrugsDetails} />
              </SummaryCard>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4 sm:p-5">
          {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
          {message && (
            <p className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </p>
          )}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1 || submitting}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            {step < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0EA5E9] px-5 py-2.5 text-sm font-bold text-white"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Register Resident"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase text-slate-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
      />
    </div>
  );
}

function ModalTextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase text-slate-500">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
      />
    </div>
  );
}

function ModalCheckGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function ModalCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}

function ModalToggleText({
  label,
  checked,
  onToggle,
  value,
  onChange,
}: {
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-white p-4">
      <label className="mb-3 flex items-center gap-3 text-sm font-bold text-slate-700">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4"
        />
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!checked}
        className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-sky-50/50 px-3 text-sm font-semibold text-slate-900 outline-none disabled:opacity-60"
      />
    </div>
  );
}

function SummaryCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-600">
        {title}
      </h4>
      <div className="grid gap-2 md:grid-cols-2">{children}</div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {String(value || "").trim() ? value : "N/A"}
      </p>
    </div>
  );
}

function yesNoText(value: boolean) {
  return value ? "Yes" : "No";
}
