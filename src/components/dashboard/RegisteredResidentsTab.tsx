"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  ClipboardList,
  Edit,
  Eye,
  HeartPulse,
  IdCard,
  Lock,
  MapPin,
  Phone,
  Save,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  EDUCATIONAL_ATTAINMENT_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/lib/barangay-options";
import { ResidentDigitalId } from "@/components/dashboard/ResidentDigitalId";

type History = Record<string, boolean | string | null> | null;

type StaffResident = {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  age: number;
  sex: string;
  birthDate: string;
  religion: string | null;
  civilStatus: string | null;
  educationalAttainment: string | null;
  occupation: string | null;
  contactNumber: string | null;
  accompanyingPerson: string | null;
  relationship: string | null;
  spouseMaidenName: string | null;
  spouseOccupation: string | null;
  spouseContactNumber: string | null;
  completeAddress: string | null;
  barangayName: string | null;
  city: string | null;
  isPregnant: boolean | null;
  user: { username: string; email: string | null; isVerified: boolean; phoneNumber: string | null } | null;
  medicalHistory: History;
  familyHistory: History;
  personalSocialHistory: History;
};

const fullName = (r: { firstName: string; middleName: string | null; lastName: string }) =>
  `${r.firstName} ${r.middleName ?? ""} ${r.lastName}`.replace(/\s+/g, " ").trim();

const tableName = (r: { firstName: string; middleName: string | null; lastName: string }) =>
  `${r.lastName}, ${r.firstName} ${r.middleName ?? ""}`.replace(/\s+/g, " ").trim();

function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

function IconActionButton({
  icon,
  label,
  variant = "primary",
  dense = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "primary" | "warning" | "danger";
  dense?: boolean;
  onClick: () => void;
}) {
  const color =
    variant === "danger"
      ? "bg-red-50 text-red-600 hover:bg-red-100"
      : variant === "warning"
      ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
      : "bg-sky-50 text-sky-600 hover:bg-sky-100";
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`inline-flex ${dense ? "h-8 w-8" : "h-10 w-10"} items-center justify-center rounded-xl transition ${color}`}
    >
      {icon}
    </button>
  );
}

export function RegisteredResidentsTab() {
  const [residents, setResidents] = useState<StaffResident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [pw, setPw] = useState<{ resident: StaffResident; action: "view" | "edit" | "digital-id" } | null>(null);
  const [password, setPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");

  const [viewResident, setViewResident] = useState<StaffResident | null>(null);
  const [digitalIdResident, setDigitalIdResident] = useState<StaffResident | null>(null);
  const [editResident, setEditResident] = useState<StaffResident | null>(null);
  const [editPassword, setEditPassword] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/staff/residents", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load residents.");
        return;
      }
      setResidents(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error("STAFF_RESIDENTS_LOAD_ERROR", err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const query = search.toLowerCase().trim();
  const filtered = residents.filter((r) => {
    if (!query) return true;
    return (
      fullName(r).toLowerCase().includes(query) ||
      String(r.age).includes(query) ||
      (r.contactNumber ?? "").toLowerCase().includes(query) ||
      (r.sex ?? "").toLowerCase().includes(query)
    );
  });

  const openReAuth = (resident: StaffResident, action: "view" | "edit" | "digital-id") => {
    setPw({ resident, action });
    setPassword("");
    setPwError("");
  };

  const confirmReAuth = async () => {
    if (!pw) return;
    if (!password.trim()) {
      setPwError("Your password is required.");
      return;
    }
    try {
      setPwLoading(true);
      setPwError("");
      const res = await fetch("/api/me/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setPwError(json.error || "Invalid password.");
        return;
      }
      if (pw.action === "view") {
        setViewResident(pw.resident);
      } else if (pw.action === "digital-id") {
        setDigitalIdResident(pw.resident);
      } else {
        setEditResident(pw.resident);
        setEditPassword(password);
      }
      setPw(null);
      setPassword("");
    } catch (err) {
      console.error("REAUTH_ERROR", err);
      setPwError("Unable to connect to the server.");
    } finally {
      setPwLoading(false);
    }
  };

  const actions = (r: StaffResident, dense: boolean) => (
    <div className={`flex items-center ${dense ? "gap-0.5" : "justify-center gap-2"}`}>
      <IconActionButton
        label="View Details"
        dense={dense}
        icon={<Eye className={dense ? "h-3.5 w-3.5" : "h-4 w-4"} />}
        onClick={() => openReAuth(r, "view")}
      />
      <IconActionButton
        label="Digital ID"
        dense={dense}
        icon={<IdCard className={dense ? "h-3.5 w-3.5" : "h-4 w-4"} />}
        onClick={() => openReAuth(r, "digital-id")}
      />
      <IconActionButton
        label="Edit Resident"
        dense={dense}
        variant="warning"
        icon={<Edit className={dense ? "h-3.5 w-3.5" : "h-4 w-4"} />}
        onClick={() => openReAuth(r, "edit")}
      />
    </div>
  );

  return (
    <div className="rounded-[24px] border border-sky-200 bg-white p-3 sm:p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Registered Residents</h2>
            <p className="text-sm text-slate-500">
              View or edit residents. Your password is required for each action.
            </p>
          </div>
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, contact, age..."
            className="min-h-[52px] w-full rounded-2xl border border-sky-200 bg-sky-50 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[140px] items-center justify-center gap-3 rounded-2xl border border-sky-200 bg-white text-sm font-semibold text-sky-600">
          <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-sky-200 border-t-sky-500" />
          Loading residents...
        </div>
      ) : (
        <>
          {/* Mobile compact list */}
          <div className="md:hidden">
            <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Resident Name
            </div>
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {filtered.length === 0 && (
                <div className="rounded-2xl bg-sky-50 px-4 py-6 text-center text-sm text-slate-500">
                  No resident found.
                </div>
              )}
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-2xl bg-sky-50 px-2.5 py-2.5 shadow-sm"
                >
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
                    {tableName(r)}
                  </p>
                  {actions(r, true)}
                </div>
              ))}
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full w-full table-fixed border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="w-[46%] px-3">Resident Name</th>
                  <th className="w-[12%] px-3">Sex</th>
                  <th className="w-[10%] px-3">Age</th>
                  <th className="w-[20%] px-3">Contact</th>
                  <th className="w-[12%] px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="rounded-2xl bg-sky-50 px-4 py-6 text-center text-sm text-slate-500">
                      No resident found.
                    </td>
                  </tr>
                )}
                {filtered.map((r) => (
                  <tr key={r.id} className="bg-sky-50 shadow-sm">
                    <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">
                      <span className="block truncate whitespace-nowrap">{tableName(r)}</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600">{r.sex}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{r.age}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{r.contactNumber || "—"}</td>
                    <td className="rounded-r-2xl px-3 py-3">{actions(r, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pw && (
        <Portal>
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[28px] border border-sky-200 bg-white p-6 shadow-2xl">
              <div className="mb-4 flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                  <Lock className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Confirm your password</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Enter your password to {pw.action} {fullName(pw.resident)}.
                </p>
              </div>
              <input
                type="password"
                value={password}
                autoFocus
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmReAuth()}
                placeholder="Your password"
                className="min-h-[50px] w-full rounded-2xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
              />
              {pwError && <p className="mt-2 text-sm font-semibold text-red-600">{pwError}</p>}
              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPw(null)}
                  className="min-h-[46px] flex-1 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmReAuth}
                  disabled={pwLoading}
                  className="min-h-[46px] flex-1 rounded-2xl bg-[#0EA5E9] text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-60"
                >
                  {pwLoading ? "Verifying..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {viewResident && (
        <Portal>
          <ViewModal resident={viewResident} onClose={() => setViewResident(null)} />
        </Portal>
      )}

      {digitalIdResident && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
            <div className="flex w-full max-w-[min(100%,52.5rem)] flex-col items-center rounded-[28px] bg-white p-4 shadow-2xl sm:p-6">
              <div className="mb-2 flex w-full items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Resident Digital ID</p>
                  <h3 className="text-xl font-black text-slate-900 line-clamp-1">{fullName(digitalIdResident)}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDigitalIdResident(null)}
                  className="ml-4 shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
              <ResidentDigitalId resident={digitalIdResident} allowDownload />
            </div>
          </div>
        </Portal>
      )}

      {editResident && (
        <Portal>
          <EditModal
            resident={editResident}
            password={editPassword}
            onClose={() => {
              setEditResident(null);
              setEditPassword("");
            }}
            onSaved={() => {
              setEditResident(null);
              setEditPassword("");
              load();
            }}
          />
        </Portal>
      )}
    </div>
  );
}

type ViewDiagnosis = {
  id: string;
  conditions?: string[] | null;
  isHealthy?: boolean;
  notes?: string | null;
  medicalAdvice?: string | null;
  createdAt: string;
  diagnosedBy?: { fullName?: string | null; barangay?: { name?: string | null } | null } | null;
};

const ASSESSMENT_CONDITIONS: { key: string; label: string; detailField?: string }[] = [
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

function ViewModal({ resident, onClose }: { resident: StaffResident; onClose: () => void }) {
  const [diagnoses, setDiagnoses] = useState<ViewDiagnosis[]>([]);
  const [tab, setTab] = useState<"identifying" | "medical" | "family" | "personal" | "assessments">("identifying");

  const loadDiagnoses = useCallback(async () => {
    try {
      const res = await fetch(`/api/residents/${resident.id}/diagnoses`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok && Array.isArray(json)) setDiagnoses(json);
    } catch (err) {
      console.error("VIEW_DIAGNOSES_ERROR", err);
    }
  }, [resident.id]);

  useEffect(() => {
    loadDiagnoses();
  }, [loadDiagnoses]);

  const mh = resident.medicalHistory;
  const fh = resident.familyHistory;
  const ph = resident.personalSocialHistory;

  const tabs = [
    { id: "identifying", label: "Identity", icon: <IdCard className="h-5 w-5" /> },
    { id: "medical", label: "Medical", icon: <HeartPulse className="h-5 w-5" /> },
    { id: "family", label: "Family", icon: <Users className="h-5 w-5" /> },
    { id: "personal", label: "Personal", icon: <ClipboardList className="h-5 w-5" /> },
    { id: "assessments", label: "Assessment", icon: <Stethoscope className="h-5 w-5" /> },
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-sky-200 bg-white shadow-2xl">
        <div className="border-b border-sky-200 bg-sky-50/60 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0EA5E9] text-white">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-sky-600">Resident Profile</p>
                <h3 className="text-xl font-black text-slate-900">{fullName(resident)}</h3>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl bg-white p-2 text-slate-600 ring-1 ring-slate-200">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex items-stretch gap-1 rounded-2xl bg-sky-50 p-1">
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-label={t.label}
                  className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition ${
                    active ? "bg-[#0EA5E9] text-white shadow-sm" : "text-slate-500 hover:bg-white"
                  }`}
                >
                  {t.icon}
                  <span className="max-w-full truncate leading-none">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === "identifying" && (
            <div>
              <SectionTitle title="Identifying Data" />
              <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
                <QrInfoGroup title="Personal Details" icon={<UserRound className="h-4 w-4" />}>
                  <QrInfoRow label="Full Name" value={fullName(resident)} />
                  <QrInfoRow label="Age" value={resident.age} />
                  <QrInfoRow label="Sex" value={resident.sex} />
                  {resident.sex === "FEMALE" && (
                    <QrInfoRow
                      label="Pregnant"
                      value={resident.isPregnant == null ? "Not specified" : resident.isPregnant ? "Yes" : "No"}
                    />
                  )}
                  <QrInfoRow label="Birth Date" value={resident.birthDate ? new Date(resident.birthDate).toLocaleDateString() : ""} />
                  <QrInfoRow label="Civil Status" value={resident.civilStatus} />
                  <QrInfoRow label="Religion" value={resident.religion} />
                  <QrInfoRow label="Education" value={resident.educationalAttainment} />
                  <QrInfoRow label="Occupation" value={resident.occupation} />
                </QrInfoGroup>

                <div className="space-y-6">
                  <QrInfoGroup title="Contact & Account" icon={<Phone className="h-4 w-4" />}>
                    <QrInfoRow label="Contact Number" value={resident.contactNumber} />
                    <QrInfoRow label="Email" value={resident.user?.email} />
                    <QrInfoRow label="Phone Number" value={resident.user?.phoneNumber} />
                    <QrInfoRow label="Username" value={resident.user?.username} />
                    <QrInfoRow label="Verified Resident" value={resident.user?.isVerified ? "Yes" : "No"} />
                    <QrInfoRow label="Accompanying Person" value={resident.accompanyingPerson} />
                    <QrInfoRow label="Relationship" value={resident.relationship} />
                    <QrInfoRow label="Spouse Maiden Name" value={resident.spouseMaidenName} />
                    <QrInfoRow label="Spouse Occupation" value={resident.spouseOccupation} />
                    <QrInfoRow label="Spouse Contact Number" value={resident.spouseContactNumber} />
                  </QrInfoGroup>

                  <QrInfoGroup title="Address" icon={<MapPin className="h-4 w-4" />}>
                    <QrInfoRow label="Sitio" value={resident.barangayName} />
                    <QrInfoRow label="City" value={resident.city} />
                    <QrInfoRow label="Complete Address" value={resident.completeAddress} />
                  </QrInfoGroup>
                </div>
              </div>
            </div>
          )}

          {tab === "medical" && (
            <div className="space-y-5">
              <SectionTitle title="Medical History" />
              <QrFlagGroup
                title="Recorded Conditions"
                icon={<Stethoscope className="h-4 w-4" />}
                tone="bad"
                columns={2}
                items={[
                  { label: "Hypertension", value: Boolean(mh?.hasHypertension) },
                  { label: "Diabetes", value: Boolean(mh?.hasDiabetes) },
                  { label: "STI / HIV", value: Boolean(mh?.hasStiHiv) },
                  { label: "Heart Disease", value: Boolean(mh?.hasHeartDisease) },
                  { label: "Kidney Failure", value: Boolean(mh?.hasKidneyFailure) },
                  { label: "Tuberculosis", value: Boolean(mh?.hasTuberculosis) },
                  { label: "Allergies", value: Boolean(mh?.hasAllergies) },
                  { label: "Cancer", value: Boolean(mh?.hasCancer) },
                  { label: "Other Conditions", value: Boolean(mh?.hasOtherConditions) },
                ]}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {mh?.allergiesDetails && <Info label="Allergies Details" value={mh.allergiesDetails} />}
                {mh?.cancerDetails && <Info label="Cancer Details" value={mh.cancerDetails} />}
                {mh?.otherConditionsDetails && <Info label="Other Conditions Details" value={mh.otherConditionsDetails} />}
                {mh?.maintenanceMedications && <Info label="Maintenance Medications" value={mh.maintenanceMedications} />}
                {mh?.previousIllnessesSurgeries && <Info label="Previous Illnesses / Surgeries" value={mh.previousIllnessesSurgeries} />}
              </div>
            </div>
          )}

          {tab === "family" && (
            <div className="space-y-5">
              <SectionTitle title="Family History" />
              <QrFlagGroup
                title="Hereditary Conditions"
                icon={<Users className="h-4 w-4" />}
                tone="bad"
                columns={2}
                items={[
                  { label: "Asthma / Allergies", value: Boolean(fh?.asthmaAllergies) },
                  { label: "Birth Defects", value: Boolean(fh?.birthDefects) },
                  { label: "Cancer", value: Boolean(fh?.cancer) },
                  { label: "Dementia", value: Boolean(fh?.dementia) },
                  { label: "Diabetes", value: Boolean(fh?.diabetes) },
                  { label: "Hypertension", value: Boolean(fh?.hypertension) },
                  { label: "Kidney Disease", value: Boolean(fh?.kidneyDisease) },
                  { label: "Mental Illness", value: Boolean(fh?.mentalIllness) },
                ]}
              />
            </div>
          )}

          {tab === "personal" && (
            <div className="space-y-5">
              <SectionTitle title="Personal / Social History" />
              <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                <QrFlagGroup
                  title="Healthy Lifestyle"
                  icon={<HeartPulse className="h-4 w-4" />}
                  tone="good"
                  items={[
                    { label: "Eats Healthy Diet", value: Boolean(ph?.eatsHealthyDiet) },
                    { label: "Adequate Physical Activity", value: Boolean(ph?.adequatePhysicalActivity) },
                    { label: "Sufficient Rest / Sleep", value: Boolean(ph?.sufficientRestSleep) },
                    { label: "Normal Growth / Development", value: Boolean(ph?.normalGrowthDevelopment) },
                    { label: "Multiple Sex Partners", value: Boolean(ph?.multipleSexPartners), tone: "bad" },
                  ]}
                />
                <QrFlagGroup
                  title="Risk Factors"
                  icon={<ShieldCheck className="h-4 w-4" />}
                  tone="bad"
                  items={[
                    { label: "Smokes Tobacco", value: Boolean(ph?.smokesTobacco) },
                    { label: "Tobacco Packs / Year", value: ph?.tobaccoPacksPerYear ?? null },
                    { label: "Drinks Alcohol", value: Boolean(ph?.drinksAlcohol) },
                    { label: "Alcohol Bottles / Day", value: ph?.alcoholBottlesPerDay ?? null },
                    { label: "Takes Illicit Drugs", value: Boolean(ph?.takesIllicitDrugs) },
                    { label: "Illicit Drugs Details", value: ph?.illicitDrugsDetails ?? null },
                  ]}
                />
              </div>
            </div>
          )}

          {tab === "assessments" && (
            <div className="space-y-5">
              <SectionTitle title="Assessment" />
              <AssessmentForm residentId={resident.id} onSaved={loadDiagnoses} />

              <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                <h4 className="mb-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                  Recorded Assessments
                </h4>
                {diagnoses.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-3 py-4 text-center text-sm font-semibold text-slate-500">
                    No assessments recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {diagnoses.map((d) => (
                      <div key={d.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800">{d.diagnosedBy?.fullName?.trim() || "Health Worker"}</p>
                          <span className="text-[11px] font-bold text-slate-400">{new Date(d.createdAt).toLocaleString()}</span>
                        </div>
                        {Array.isArray(d.conditions) && d.conditions.length > 0 && (
                          <p className="mt-1 text-xs font-semibold text-amber-700">{d.conditions.join(", ")}</p>
                        )}
                        {d.isHealthy && (
                          <p className="mt-1 text-xs font-semibold text-emerald-700">Healthy / No findings</p>
                        )}
                        {d.notes && d.notes.trim() && (
                          <p className="mt-1 whitespace-pre-line text-xs text-slate-700"><span className="font-bold">Notes:</span> {d.notes}</p>
                        )}
                        {d.medicalAdvice && d.medicalAdvice.trim() && (
                          <p className="mt-1 whitespace-pre-line text-xs text-emerald-800"><span className="font-bold">Medical Advice:</span> {d.medicalAdvice}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssessmentForm({ residentId, onSaved }: { residentId: string; onSaved: () => void }) {
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
    setConditions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
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

function EditModal({
  resident,
  password,
  onClose,
  onSaved,
}: {
  resident: StaffResident;
  password: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    firstName: resident.firstName ?? "",
    middleName: resident.middleName ?? "",
    lastName: resident.lastName ?? "",
    age: String(resident.age ?? ""),
    sex: resident.sex ?? "",
    birthDate: resident.birthDate ? resident.birthDate.split("T")[0] : "",
    religion: resident.religion ?? "",
    civilStatus: resident.civilStatus ?? "",
    educationalAttainment: resident.educationalAttainment ?? "",
    occupation: resident.occupation ?? "",
    contactNumber: resident.contactNumber ?? "",
    accompanyingPerson: resident.accompanyingPerson ?? "",
    relationship: resident.relationship ?? "",
    completeAddress: resident.completeAddress ?? "",
    barangayName: resident.barangayName ?? "",
    city: resident.city ?? "",
    email: resident.user?.email ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const res = await fetch(`/api/residents/${resident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: Number(form.age), password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Failed to save changes.");
        return;
      }
      setMessage("Resident updated.");
      setTimeout(() => onSaved(), 700);
    } catch (err) {
      console.error("EDIT_SAVE_ERROR", err);
      setError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  const F = ({ label, k }: { label: string; k: keyof typeof form }) => (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</label>
      <input
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        className="min-h-[46px] w-full rounded-2xl border border-sky-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-sky-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-sky-200 bg-sky-50/60 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white">
              <Edit className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-600">Edit Resident</p>
              <h3 className="text-xl font-black text-slate-900">{fullName(resident)}</h3>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl bg-white p-2 text-slate-600 ring-1 ring-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified — you may edit this resident's identifying data
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <F label="First Name" k="firstName" />
            <F label="Middle Name" k="middleName" />
            <F label="Last Name" k="lastName" />
            <F label="Age" k="age" />
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Sex</label>
              <select
                value={form.sex}
                onChange={(e) => set("sex", e.target.value)}
                className="min-h-[46px] w-full rounded-2xl border border-sky-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <F label="Birth Date" k="birthDate" />
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Civil Status</label>
              <select
                value={form.civilStatus}
                onChange={(e) => set("civilStatus", e.target.value)}
                className="min-h-[46px] w-full rounded-2xl border border-sky-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
              >
                <option value="">Select</option>
                {["SINGLE", "MARRIED", "WIDOWED", "ANNULLED", "SEPARATED", "COHABITANT"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <F label="Religion" k="religion" />
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Educational Attainment</label>
              <select
                value={form.educationalAttainment}
                onChange={(e) => set("educationalAttainment", e.target.value)}
                className="min-h-[46px] w-full rounded-2xl border border-sky-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
              >
                <option value="">Select</option>
                {EDUCATIONAL_ATTAINMENT_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <F label="Occupation" k="occupation" />
            <F label="Contact Number" k="contactNumber" />
            <F label="Email" k="email" />
            <F label="Accompanying Person" k="accompanyingPerson" />
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Relationship</label>
              <select
                value={form.relationship}
                onChange={(e) => set("relationship", e.target.value)}
                className="min-h-[46px] w-full rounded-2xl border border-sky-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
              >
                <option value="">Select</option>
                {RELATIONSHIP_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <F label="Complete Address" k="completeAddress" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-sky-200 bg-white p-4">
          <div className="text-sm">
            {error && <span className="font-semibold text-red-600">{error}</span>}
            {message && <span className="font-semibold text-emerald-700">{message}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="min-h-[46px] rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-2xl bg-[#0EA5E9] px-5 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-black text-blue-950">{title}</h2>
      <div className="mt-2 h-1 w-20 rounded-full bg-blue-600" />
    </div>
  );
}

function QrInfoGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100">
          {icon}
        </span>
        <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</h4>
      </div>
      <dl className="divide-y divide-slate-100">{children}</dl>
    </div>
  );
}

function QrInfoRow({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  return (
    <div className="flex items-baseline justify-between gap-6 py-3">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className="break-words text-right text-sm font-bold text-slate-900">{String(value)}</span>
    </div>
  );
}

function QrFlagGroup({
  title,
  icon,
  items,
  tone = "bad",
  columns = 1,
}: {
  title: string;
  icon: React.ReactNode;
  items: { label: string; value: unknown; tone?: "good" | "bad" }[];
  tone?: "good" | "bad";
  columns?: 1 | 2;
}) {
  const visible = items.filter((item) =>
    typeof item.value === "boolean"
      ? true
      : item.value !== null && item.value !== undefined && String(item.value).trim() !== ""
  );

  if (visible.length === 0) {
    return <p className="text-sm font-semibold text-slate-400">No records in this section.</p>;
  }

  const headerBadge =
    tone === "bad"
      ? "bg-rose-50 text-rose-600 ring-rose-100"
      : "bg-emerald-50 text-emerald-600 ring-emerald-100";

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ${headerBadge}`}>{icon}</span>
        <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</h4>
      </div>
      <div className={columns === 2 ? "grid sm:grid-cols-2 sm:gap-x-10" : ""}>
        {visible.map((item) => {
          const isBool = typeof item.value === "boolean";
          const itemTone = item.tone ?? tone;
          return (
            <div key={item.label} className="flex items-center justify-between gap-4 border-b border-slate-100 py-3">
              <span className="text-sm text-slate-500">{item.label}</span>
              {isBool ? (
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                    item.value === true
                      ? itemTone === "good"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                        : "bg-rose-50 text-rose-700 ring-rose-100"
                      : "bg-slate-100 text-slate-500 ring-slate-200"
                  }`}
                >
                  {item.value === true ? "Yes" : "No"}
                </span>
              ) : (
                <span className="break-words text-right text-sm font-bold text-slate-900">{String(item.value)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  const text = value === null || value === undefined || String(value).trim() === "" ? "N/A" : String(value);
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{text}</p>
    </div>
  );
}
