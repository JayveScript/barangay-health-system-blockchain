"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  Lock,
  Pencil,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  EDUCATIONAL_ATTAINMENT_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/lib/barangay-options";

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

export function RegisteredResidentsTab() {
  const [residents, setResidents] = useState<StaffResident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Re-auth modal
  const [pw, setPw] = useState<{ resident: StaffResident; action: "view" | "edit" } | null>(null);
  const [password, setPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");

  // Opened modals
  const [viewResident, setViewResident] = useState<StaffResident | null>(null);
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
      (r.contactNumber ?? "").toLowerCase().includes(query)
    );
  });

  const openReAuth = (resident: StaffResident, action: "view" | "edit") => {
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

  return (
    <div className="space-y-5 pb-4">
      <div className="rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">Registered Residents</h2>
              <p className="text-sm text-slate-500">
                View or edit residents in your barangay. Your password is required for each action.
              </p>
            </div>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resident..."
              className="min-h-[50px] w-full rounded-2xl border border-sky-200 bg-sky-50 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
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
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-sky-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
            No residents found.
          </div>
        ) : (
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 ring-1 ring-sky-200">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{fullName(r)}</p>
                    <p className="truncate text-xs font-semibold text-slate-500">
                      {r.sex} · {r.age} yrs{r.barangayName ? ` · ${r.barangayName}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openReAuth(r, "view")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-600 hover:bg-sky-50"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => openReAuth(r, "edit")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0EA5E9] px-3 py-2 text-xs font-bold text-white hover:bg-sky-600"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Re-auth modal */}
      {pw && (
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
      )}

      {viewResident && (
        <ViewModal resident={viewResident} onClose={() => setViewResident(null)} />
      )}

      {editResident && (
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
      )}
    </div>
  );
}

function ViewModal({ resident, onClose }: { resident: StaffResident; onClose: () => void }) {
  const yn = (v: unknown) => (v ? "Yes" : "No");
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
              <Pencil className="h-5 w-5" />
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
