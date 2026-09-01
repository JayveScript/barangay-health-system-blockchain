"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { InlineLoader } from "@/components/dashboard/InlineLoader";
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
  MapPin,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import {
  SectionTitle,
  QrInfoGroup,
  QrInfoRow,
  QrFlagGroup,
  InfoCard,
} from "@/components/dashboard/ResidentInfoSections";
import { AssessmentForm } from "@/components/dashboard/AssessmentForm";

type Identifying = Record<string, unknown> | null | undefined;
type HistoryJson = Record<string, unknown> | null | undefined;

export type InboxReferral = {
  id: string;
  residentId: string;
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

type TabId = "identifying" | "medical" | "family" | "social" | "assessment";

type ReferralDiagnosis = {
  id: string;
  conditions?: string[] | null;
  isHealthy?: boolean;
  notes?: string | null;
  medicalAdvice?: string | null;
  createdAt: string;
  diagnosedBy?: { fullName?: string | null } | null;
};

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
        <InlineLoader label="Loading referrals..." />
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
  const [diagnoses, setDiagnoses] = useState<ReferralDiagnosis[]>([]);
  const identifying = (referral.identifyingData || {}) as Record<string, unknown>;
  const medical = (referral.medicalHistory || {}) as Record<string, unknown>;
  const family = (referral.familyHistory || {}) as Record<string, unknown>;
  const social = (referral.personalSocialHistory || {}) as Record<string, unknown>;
  const pending = (referral.status || "PENDING").toUpperCase() === "PENDING";

  const loadDiagnoses = useCallback(async () => {
    try {
      const res = await fetch(`/api/residents/${referral.residentId}/diagnoses`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok && Array.isArray(json)) setDiagnoses(json);
    } catch (err) {
      console.error("REFERRAL_DIAGNOSES_ERROR", err);
    }
  }, [referral.residentId]);

  useEffect(() => {
    loadDiagnoses();
  }, [loadDiagnoses]);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "identifying", label: "Identity", icon: <IdCard className="h-5 w-5" /> },
    { id: "medical", label: "Medical", icon: <HeartPulse className="h-5 w-5" /> },
    { id: "family", label: "Family", icon: <Users className="h-5 w-5" /> },
    { id: "social", label: "Social", icon: <ClipboardList className="h-5 w-5" /> },
    { id: "assessment", label: "Assessment", icon: <Stethoscope className="h-5 w-5" /> },
  ];

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:p-4">
      <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden border border-sky-200 bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-[30px]">
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
          <div className="mb-5 rounded-[24px] border border-sky-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard label="Referral Reason" value={referral.reason} />
              <InfoCard label="Notes" value={referral.notes} />
            </div>
          </div>

          <div className="rounded-[24px] border border-sky-200 bg-white p-4 shadow-sm sm:p-6">
            {tab === "identifying" && (
              <div>
                <SectionTitle title="Identifying Data" />
                <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
                  <QrInfoGroup title="Personal Details" icon={<UserRound className="h-4 w-4" />}>
                    <QrInfoRow label="Full Name" value={identifying.fullName} />
                    <QrInfoRow label="Age" value={identifying.age} />
                    <QrInfoRow label="Sex" value={identifying.sex} />
                    <QrInfoRow label="Birth Date" value={fmtDate(identifying.birthDate)} />
                    <QrInfoRow label="Civil Status" value={identifying.civilStatus} />
                    <QrInfoRow label="Religion" value={identifying.religion} />
                    <QrInfoRow label="Educational Attainment" value={identifying.educationalAttainment} />
                    <QrInfoRow label="Occupation" value={identifying.occupation} />
                  </QrInfoGroup>

                  <div className="space-y-6">
                    <QrInfoGroup title="Contact" icon={<Phone className="h-4 w-4" />}>
                      <QrInfoRow label="Contact Number" value={identifying.contactNumber} />
                      <QrInfoRow label="Email" value={identifying.email} />
                      <QrInfoRow label="Accompanying Person" value={identifying.accompanyingPerson} />
                      <QrInfoRow label="Relationship" value={identifying.relationship} />
                    </QrInfoGroup>

                    <QrInfoGroup title="Address" icon={<MapPin className="h-4 w-4" />}>
                      <QrInfoRow label="House / Street" value={identifying.houseStreet} />
                      <QrInfoRow label="Barangay" value={identifying.barangayName} />
                      <QrInfoRow label="City" value={identifying.city} />
                      <QrInfoRow label="Complete Address" value={identifying.completeAddress} />
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
                    { label: "Hypertension", value: Boolean(medical.hasHypertension) },
                    { label: "Diabetes", value: Boolean(medical.hasDiabetes) },
                    { label: "STI / HIV", value: Boolean(medical.hasStiHiv) },
                    { label: "Heart Disease", value: Boolean(medical.hasHeartDisease) },
                    { label: "Kidney Failure", value: Boolean(medical.hasKidneyFailure) },
                    { label: "Tuberculosis", value: Boolean(medical.hasTuberculosis) },
                    { label: "Allergies", value: Boolean(medical.hasAllergies) },
                    { label: "Cancer", value: Boolean(medical.hasCancer) },
                    { label: "Other Conditions", value: Boolean(medical.hasOtherConditions) },
                  ]}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <InfoCard label="Allergies Details" value={medical.allergiesDetails} />
                  <InfoCard label="Cancer Details" value={medical.cancerDetails} />
                  <InfoCard label="Other Conditions Details" value={medical.otherConditionsDetails} />
                  <InfoCard label="Maintenance Medications" value={medical.maintenanceMedications} />
                  <InfoCard label="Previous Illnesses / Surgeries" value={medical.previousIllnessesSurgeries} />
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
                    { label: "Asthma / Allergies", value: Boolean(family.asthmaAllergies) },
                    { label: "Birth Defects", value: Boolean(family.birthDefects) },
                    { label: "Cancer", value: Boolean(family.cancer) },
                    { label: "Dementia", value: Boolean(family.dementia) },
                    { label: "Diabetes", value: Boolean(family.diabetes) },
                    { label: "Hypertension", value: Boolean(family.hypertension) },
                    { label: "Kidney Disease", value: Boolean(family.kidneyDisease) },
                    { label: "Mental Illness", value: Boolean(family.mentalIllness) },
                  ]}
                />
              </div>
            )}

            {tab === "social" && (
              <div className="space-y-5">
                <SectionTitle title="Personal / Social History" />
                <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                  <QrFlagGroup
                    title="Healthy Lifestyle"
                    icon={<HeartPulse className="h-4 w-4" />}
                    tone="good"
                    items={[
                      { label: "Eats Healthy Diet", value: Boolean(social.eatsHealthyDiet) },
                      { label: "Adequate Physical Activity", value: Boolean(social.adequatePhysicalActivity) },
                      { label: "Sufficient Rest / Sleep", value: Boolean(social.sufficientRestSleep) },
                      { label: "Normal Growth / Development", value: Boolean(social.normalGrowthDevelopment) },
                      { label: "Multiple Sex Partners", value: Boolean(social.multipleSexPartners), tone: "bad" },
                    ]}
                  />
                  <QrFlagGroup
                    title="Risk Factors"
                    icon={<ShieldCheck className="h-4 w-4" />}
                    tone="bad"
                    items={[
                      { label: "Smokes Tobacco", value: Boolean(social.smokesTobacco) },
                      { label: "Tobacco Packs / Year", value: social.tobaccoPacksPerYear ?? null },
                      { label: "Drinks Alcohol", value: Boolean(social.drinksAlcohol) },
                      { label: "Alcohol Bottles / Day", value: social.alcoholBottlesPerDay ?? null },
                      { label: "Takes Illicit Drugs", value: Boolean(social.takesIllicitDrugs) },
                      { label: "Illicit Drugs Details", value: social.illicitDrugsDetails ?? null },
                    ]}
                  />
                </div>
              </div>
            )}

            {tab === "assessment" && (
              <div className="space-y-5">
                <SectionTitle title="Assessment" />
                <AssessmentForm
                  residentId={referral.residentId}
                  referralId={referral.id}
                  onSaved={loadDiagnoses}
                />

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
