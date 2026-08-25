"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ClipboardList,
  Edit,
  Eye,
  IdCard,
  Lock,
  Save,
  Search,
  ShieldCheck,
  UserRound,
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

function ViewModal({ resident, onClose }: { resident: StaffResident; onClose: () => void }) {
  const yn = (v: unknown) => (v ? "Yes" : "No");
  const [diagnoses, setDiagnoses] = useState<ViewDiagnosis[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/residents/${resident.id}/diagnoses`, { cache: "no-store" });
        const json = await res.json();
        if (res.ok && Array.isArray(json)) setDiagnoses(json);
      } catch (err) {
        console.error("VIEW_DIAGNOSES_ERROR", err);
      }
    })();
  }, [resident.id]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-sky-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-sky-200 bg-sky-50/60 p-5">
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

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <ViewSection title="Identifying Data">
            <Info label="Full Name" value={fullName(resident)} />
            <Info label="Age" value={resident.age} />
            <Info label="Sex" value={resident.sex} />
            {resident.sex === "FEMALE" && (
              <Info label="Pregnant" value={resident.isPregnant == null ? "N/A" : resident.isPregnant ? "Yes" : "No"} />
            )}
            <Info label="Birth Date" value={resident.birthDate ? new Date(resident.birthDate).toLocaleDateString() : ""} />
            <Info label="Civil Status" value={resident.civilStatus} />
            <Info label="Religion" value={resident.religion} />
            <Info label="Education" value={resident.educationalAttainment} />
            <Info label="Occupation" value={resident.occupation} />
            <Info label="Contact Number" value={resident.contactNumber} />
            <Info label="Email" value={resident.user?.email} />
            <Info label="Username" value={resident.user?.username} />
            <Info label="Address" value={resident.completeAddress} />
            <Info label="Sitio" value={resident.barangayName} />
          </ViewSection>

          {resident.medicalHistory && (
            <ViewSection title="Past Medical History">
              <Info label="Hypertension" value={yn(resident.medicalHistory.hasHypertension)} />
              <Info label="Diabetes" value={yn(resident.medicalHistory.hasDiabetes)} />
              <Info label="STI / HIV" value={yn(resident.medicalHistory.hasStiHiv)} />
              <Info label="Heart Disease" value={yn(resident.medicalHistory.hasHeartDisease)} />
              <Info label="Kidney Failure" value={yn(resident.medicalHistory.hasKidneyFailure)} />
              <Info label="Tuberculosis" value={yn(resident.medicalHistory.hasTuberculosis)} />
              <Info label="Allergies" value={yn(resident.medicalHistory.hasAllergies)} />
              <Info label="Cancer" value={yn(resident.medicalHistory.hasCancer)} />
            </ViewSection>
          )}

          {resident.familyHistory && (
            <ViewSection title="Family History">
              <Info label="Asthma / Allergies" value={yn(resident.familyHistory.asthmaAllergies)} />
              <Info label="Birth Defects" value={yn(resident.familyHistory.birthDefects)} />
              <Info label="Cancer" value={yn(resident.familyHistory.cancer)} />
              <Info label="Dementia" value={yn(resident.familyHistory.dementia)} />
              <Info label="Diabetes" value={yn(resident.familyHistory.diabetes)} />
              <Info label="Hypertension" value={yn(resident.familyHistory.hypertension)} />
              <Info label="Kidney Disease" value={yn(resident.familyHistory.kidneyDisease)} />
              <Info label="Mental Illness" value={yn(resident.familyHistory.mentalIllness)} />
            </ViewSection>
          )}

          {resident.personalSocialHistory && (
            <ViewSection title="Personal / Social History">
              <Info label="Eats Healthy Diet" value={yn(resident.personalSocialHistory.eatsHealthyDiet)} />
              <Info label="Adequate Physical Activity" value={yn(resident.personalSocialHistory.adequatePhysicalActivity)} />
              <Info label="Sufficient Rest / Sleep" value={yn(resident.personalSocialHistory.sufficientRestSleep)} />
              <Info label="Smokes Tobacco" value={yn(resident.personalSocialHistory.smokesTobacco)} />
              <Info label="Drinks Alcohol" value={yn(resident.personalSocialHistory.drinksAlcohol)} />
              <Info label="Takes Illicit Drugs" value={yn(resident.personalSocialHistory.takesIllicitDrugs)} />
            </ViewSection>
          )}

          <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
            <h4 className="mb-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
              Assessments &amp; Medical Advice
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
      </div>
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

function ViewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
      <h4 className="mb-3 rounded-lg bg-[#0EA5E9] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
        {title}
      </h4>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
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
