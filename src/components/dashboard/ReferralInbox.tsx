"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  IdCard,
  HeartPulse,
  Users,
  ClipboardList,
  Eye,
  Check,
  X,
  Inbox,
  RefreshCw,
  Lock,
} from "lucide-react";

// ── Types (mirror the referral JSON returned by the API) ──────────────────────
type Identifying = Record<string, unknown> | null | undefined;
type HistoryJson = Record<string, unknown> | null | undefined;

export type InboxReferral = {
  id: string;
  status: string;
  reason?: string | null;
  notes?: string | null;
  identifyingData: Identifying;
  medicalHistory: HistoryJson;
  familyHistory: HistoryJson;
  personalSocialHistory: HistoryJson;
  createdAt: string;
  sourceBarangay: { name: string };
  targetBarangay: { name: string };
  referredByStaff?: { fullName?: string | null; username: string } | null;
};

type TabId = "identifying" | "medical" | "family" | "social";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || String(value).trim() === "") return "N/A";
  return String(value);
}
function fmtDate(value: unknown) {
  if (!value) return "N/A";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime())
    ? "N/A"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function fmtDateTime(value: unknown) {
  if (!value) return "";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}
function residentName(r: InboxReferral) {
  const d = (r.identifyingData || {}) as Record<string, string>;
  return (
    d.fullName ||
    `${d.firstName || ""} ${d.middleName || ""} ${d.lastName || ""}`.replace(/\s+/g, " ").trim() ||
    "Resident"
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "PENDING").toUpperCase();
  const cls =
    s === "ACCEPTED"
      ? "bg-emerald-100 text-emerald-700"
      : s === "REJECTED"
      ? "bg-red-100 text-red-600"
      : "bg-amber-100 text-amber-700";
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${cls}`}>
      {s}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ReferralInbox({
  endpoint = "/api/doctor/referred-residents",
  title = "Referred Residents",
  subtitle = "Residents referred to your barangay.",
}: {
  endpoint?: string;
  title?: string;
  subtitle?: string;
}) {
  const [referrals, setReferrals] = useState<InboxReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<InboxReferral | null>(null);
  const [pendingView, setPendingView] = useState<InboxReferral | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(endpoint);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load referrals.");
        return;
      }
      setReferrals(Array.isArray(json.referrals) ? json.referrals : []);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: "accept" | "reject") => {
    try {
      setBusyId(id);
      setError("");
      const res = await fetch(`/api/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to update referral.");
        return;
      }
      await load();
      setSelected(null);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between gap-3 rounded-[24px] border border-sky-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <Inbox className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
            <p className="truncate text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          aria-label="Refresh"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-[24px] border border-sky-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
          Loading referrals...
        </div>
      ) : referrals.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-sky-200 bg-sky-50 p-10 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-sky-300" />
          <p className="text-sm font-bold text-slate-500">No referred residents yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((r) => {
            const pending = (r.status || "PENDING").toUpperCase() === "PENDING";
            const busy = busyId === r.id;
            return (
              <div
                key={r.id}
                className="rounded-[22px] border border-sky-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="break-words text-base font-black text-slate-900">
                        {residentName(r)}
                      </h4>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 text-sm font-semibold text-sky-600">
                      From {r.sourceBarangay.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{fmtDateTime(r.createdAt)}</p>
                    {r.reason && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{r.reason}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingView(r)}
                    aria-label="View full info (password required)"
                    title="View full info (password required)"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>

                {pending && (
                  <div className="mt-3 flex gap-2 border-t border-sky-100 pt-3">
                    <button
                      type="button"
                      onClick={() => act(r.id, "accept")}
                      disabled={busy}
                      className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" />
                      {busy ? "..." : "Accept"}
                    </button>
                    <button
                      type="button"
                      onClick={() => act(r.id, "reject")}
                      disabled={busy}
                      className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <ReferralModal
          referral={selected}
          busy={busyId === selected.id}
          onAccept={() => act(selected.id, "accept")}
          onReject={() => act(selected.id, "reject")}
          onClose={() => setSelected(null)}
        />
      )}

      {pendingView && (
        <PasswordGate
          residentName={residentName(pendingView)}
          onCancel={() => setPendingView(null)}
          onVerified={() => {
            setSelected(pendingView);
            setPendingView(null);
          }}
        />
      )}
    </div>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function ReferralModal({
  referral,
  busy,
  onAccept,
  onReject,
  onClose,
}: {
  referral: InboxReferral;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabId>("identifying");
  const identifying = (referral.identifyingData || {}) as Record<string, unknown>;
  const medical = (referral.medicalHistory || {}) as Record<string, unknown>;
  const family = (referral.familyHistory || {}) as Record<string, unknown>;
  const social = (referral.personalSocialHistory || {}) as Record<string, unknown>;
  const pending = (referral.status || "PENDING").toUpperCase() === "PENDING";

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "identifying", label: "Identity", icon: <IdCard className="h-5 w-5" /> },
    { id: "medical", label: "Medical", icon: <HeartPulse className="h-5 w-5" /> },
    { id: "family", label: "Family", icon: <Users className="h-5 w-5" /> },
    { id: "social", label: "Social", icon: <ClipboardList className="h-5 w-5" /> },
  ];

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-sky-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 bg-gradient-to-r from-[#F8FBFF] via-white to-[#F8FBFF] px-4 py-4 sm:px-7 sm:py-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Back"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                {residentName(referral)}
              </h2>
              <p className="truncate text-xs text-slate-500 sm:text-sm">
                {referral.sourceBarangay.name} → {referral.targetBarangay.name}
              </p>
            </div>
            <StatusBadge status={referral.status} />
          </div>

          {/* One-line icon tab strip */}
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

        <div className="min-h-0 flex-1 overflow-y-auto bg-sky-50 p-4 sm:p-5">
          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <DetailInfo label="Referral Reason" value={referral.reason} />
            <DetailInfo label="Notes" value={referral.notes} />
          </div>

          {tab === "identifying" && (
            <DetailSection icon={<IdCard className="h-5 w-5" />} title="Identifying Data">
              <DetailInfo label="Full Name" value={identifying.fullName} />
              <DetailInfo label="Age" value={identifying.age} />
              <DetailInfo label="Sex" value={identifying.sex} />
              <DetailInfo label="Birth Date" value={fmtDate(identifying.birthDate)} />
              <DetailInfo label="Civil Status" value={identifying.civilStatus} />
              <DetailInfo label="Religion" value={identifying.religion} />
              <DetailInfo label="Educational Attainment" value={identifying.educationalAttainment} />
              <DetailInfo label="Occupation" value={identifying.occupation} />
              <DetailInfo label="Contact Number" value={identifying.contactNumber} />
              <DetailInfo label="Email" value={identifying.email} />
              <DetailInfo label="House / Street" value={identifying.houseStreet} />
              <DetailInfo label="Complete Address" value={identifying.completeAddress} />
              <DetailInfo label="Barangay" value={identifying.barangayName} />
              <DetailInfo label="City" value={identifying.city} />
              <DetailInfo label="Accompanying Person" value={identifying.accompanyingPerson} />
              <DetailInfo label="Relationship" value={identifying.relationship} />
            </DetailSection>
          )}

          {tab === "medical" && (
            <DetailSection icon={<HeartPulse className="h-5 w-5" />} title="Past Medical History">
              <DetailInfo label="Hypertension" value={medical.hasHypertension} />
              <DetailInfo label="Diabetes" value={medical.hasDiabetes} />
              <DetailInfo label="STI / HIV" value={medical.hasStiHiv} />
              <DetailInfo label="Heart Disease" value={medical.hasHeartDisease} />
              <DetailInfo label="Kidney Failure" value={medical.hasKidneyFailure} />
              <DetailInfo label="Tuberculosis" value={medical.hasTuberculosis} />
              <DetailInfo label="Allergies" value={medical.hasAllergies} />
              <DetailInfo label="Allergies Details" value={medical.allergiesDetails} />
              <DetailInfo label="Cancer" value={medical.hasCancer} />
              <DetailInfo label="Cancer Details" value={medical.cancerDetails} />
              <DetailInfo label="Other Conditions" value={medical.hasOtherConditions} />
              <DetailInfo label="Other Conditions Details" value={medical.otherConditionsDetails} />
              <DetailInfo label="Maintenance Medications" value={medical.maintenanceMedications} />
              <DetailInfo label="Previous Illnesses / Surgeries" value={medical.previousIllnessesSurgeries} />
            </DetailSection>
          )}

          {tab === "family" && (
            <DetailSection icon={<Users className="h-5 w-5" />} title="Family History">
              <DetailInfo label="Asthma / Allergies" value={family.asthmaAllergies} />
              <DetailInfo label="Birth Defects" value={family.birthDefects} />
              <DetailInfo label="Cancer" value={family.cancer} />
              <DetailInfo label="Dementia" value={family.dementia} />
              <DetailInfo label="Diabetes" value={family.diabetes} />
              <DetailInfo label="Hypertension" value={family.hypertension} />
              <DetailInfo label="Kidney Disease" value={family.kidneyDisease} />
              <DetailInfo label="Mental Illness" value={family.mentalIllness} />
            </DetailSection>
          )}

          {tab === "social" && (
            <DetailSection icon={<ClipboardList className="h-5 w-5" />} title="Personal / Social History">
              <DetailInfo label="Eats Healthy Diet" value={social.eatsHealthyDiet} />
              <DetailInfo label="Adequate Physical Activity" value={social.adequatePhysicalActivity} />
              <DetailInfo label="Sufficient Rest / Sleep" value={social.sufficientRestSleep} />
              <DetailInfo label="Normal Growth / Development" value={social.normalGrowthDevelopment} />
              <DetailInfo label="Multiple Sex Partners" value={social.multipleSexPartners} />
              <DetailInfo label="Smokes Tobacco" value={social.smokesTobacco} />
              <DetailInfo label="Tobacco Packs Per Year" value={social.tobaccoPacksPerYear} />
              <DetailInfo label="Drinks Alcohol" value={social.drinksAlcohol} />
              <DetailInfo label="Alcohol Bottles Per Day" value={social.alcoholBottlesPerDay} />
              <DetailInfo label="Takes Illicit Drugs" value={social.takesIllicitDrugs} />
              <DetailInfo label="Illicit Drugs Details" value={social.illicitDrugsDetails} />
            </DetailSection>
          )}
        </div>

        {pending && (
          <div className="flex gap-2 border-t border-slate-200 bg-white p-4">
            <button
              type="button"
              onClick={onReject}
              disabled={busy}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              Reject
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={busy}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {busy ? "Saving..." : "Accept"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function DetailSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-sky-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          {icon}
        </div>
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

function DetailInfo({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{fmtValue(value)}</p>
    </div>
  );
}

// Password confirmation gate — the user must re-enter their password before
// the referral's full record is revealed. Exported for reuse (staff + doctor).
export function PasswordGate({
  residentName,
  onCancel,
  onVerified,
}: {
  residentName: string;
  onCancel: () => void;
  onVerified: () => void;
}) {
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErr("Password is required.");
      return;
    }
    try {
      setVerifying(true);
      setErr("");
      const res = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error || "Invalid password.");
        return;
      }
      onVerified();
    } catch {
      setErr("Unable to connect to the server.");
    } finally {
      setVerifying(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[28px] border border-sky-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <Lock className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Confirm your password</h3>
          <p className="mt-1 text-sm text-slate-500">
            Enter your password to view{" "}
            <span className="font-semibold text-slate-700">{residentName}</span>&apos;s
            referral record.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="flex min-h-[52px] items-center rounded-2xl border border-sky-200 bg-white px-4 transition focus-within:border-[#0EA5E9]">
            <Lock className="mr-3 h-5 w-5 shrink-0 text-slate-400" />
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
            />
          </div>

          {err && (
            <div className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
              {err}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[48px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={verifying}
              className="min-h-[48px] flex-1 rounded-2xl bg-[#0EA5E9] px-4 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-60"
            >
              {verifying ? "Verifying..." : "Unlock"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
