"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Eye,
  HeartPulse,
  IdCard,
  Inbox,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { PasswordGate } from "@/components/dashboard/ReferralInbox";
import { InlineLoader } from "@/components/dashboard/InlineLoader";
import {
  SectionTitle,
  QrInfoGroup,
  QrInfoRow,
  QrFlagGroup,
  InfoCard,
} from "@/components/dashboard/ResidentInfoSections";
import { AssessmentForm } from "@/components/dashboard/AssessmentForm";

type ReferralAvailabilitySummary = {
  hasAvailableDoctor: boolean;
  availableSlots: number;
  totalSlots: number;
  postedSchedules: number;
  nextAvailability?: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    doctorName: string;
    freeSlots: number;
  } | null;
};

type ReferralBarangayOption = {
  id: string;
  name: string;
  municipality?: string | null;
  availability: ReferralAvailabilitySummary;
};

type ReferralResidentOption = {
  id: string;
  fullName: string;
  age?: number | null;
  sex?: string | null;
  birthDate?: string | null;
  contactNumber?: string | null;
  completeAddress?: string | null;
};

type ReferralIdentifyingData = {
  id?: string;
  fullName?: string | null;
  lastName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  age?: number | null;
  sex?: string | null;
  birthDate?: string | null;
  religion?: string | null;
  houseStreet?: string | null;
  completeAddress?: string | null;
  barangayName?: string | null;
  city?: string | null;
  civilStatus?: string | null;
  contactNumber?: string | null;
  educationalAttainment?: string | null;
  occupation?: string | null;
  accompanyingPerson?: string | null;
  relationship?: string | null;
  spouseMaidenName?: string | null;
  spouseOccupation?: string | null;
  spouseContactNumber?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  username?: string | null;
  isVerified?: boolean | null;
  sourceBarangayName?: string | null;
  sourceMunicipality?: string | null;
};

type ReferralMedicalHistory = {
  hasHypertension?: boolean | null;
  hasDiabetes?: boolean | null;
  hasStiHiv?: boolean | null;
  hasHeartDisease?: boolean | null;
  hasKidneyFailure?: boolean | null;
  hasTuberculosis?: boolean | null;
  hasAllergies?: boolean | null;
  allergiesDetails?: string | null;
  hasCancer?: boolean | null;
  cancerDetails?: string | null;
  hasOtherConditions?: boolean | null;
  otherConditionsDetails?: string | null;
  maintenanceMedications?: string | null;
  previousIllnessesSurgeries?: string | null;
} | null;

type ReferralFamilyHistory = {
  asthmaAllergies?: boolean | null;
  birthDefects?: boolean | null;
  cancer?: boolean | null;
  dementia?: boolean | null;
  diabetes?: boolean | null;
  hypertension?: boolean | null;
  kidneyDisease?: boolean | null;
  mentalIllness?: boolean | null;
} | null;

type ReferralSocialHistory = {
  eatsHealthyDiet?: boolean | null;
  adequatePhysicalActivity?: boolean | null;
  sufficientRestSleep?: boolean | null;
  normalGrowthDevelopment?: boolean | null;
  multipleSexPartners?: boolean | null;
  smokesTobacco?: boolean | null;
  tobaccoPacksPerYear?: string | null;
  drinksAlcohol?: boolean | null;
  alcoholBottlesPerDay?: string | null;
  takesIllicitDrugs?: boolean | null;
  illicitDrugsDetails?: string | null;
} | null;

type ResidentReferral = {
  id: string;
  residentId: string;
  status: string;
  reason?: string | null;
  notes?: string | null;
  identifyingData: ReferralIdentifyingData;
  medicalHistory?: ReferralMedicalHistory;
  familyHistory?: ReferralFamilyHistory;
  personalSocialHistory?: ReferralSocialHistory;
  createdAt: string;
  sourceBarangay: { id: string; name: string; municipality?: string | null };
  targetBarangay: { id: string; name: string; municipality?: string | null };
  referredByStaff: { id: string; fullName?: string | null; username: string };
};

type StaffReferralsResponse = {
  localAvailability: ReferralAvailabilitySummary;
  targetBarangays: ReferralBarangayOption[];
  residents: ReferralResidentOption[];
  receivedReferrals: ResidentReferral[];
  sentReferrals: ResidentReferral[];
};

function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sameLocalDate(iso: string, dateStr: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return localDateStr(d) === dateStr;
}

export function ReferralsTab() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [localAvailability, setLocalAvailability] =
    useState<ReferralAvailabilitySummary | null>(null);
  const [targetBarangays, setTargetBarangays] = useState<
    ReferralBarangayOption[]
  >([]);
  const [residents, setResidents] = useState<ReferralResidentOption[]>([]);
  const [receivedReferrals, setReceivedReferrals] = useState<
    ResidentReferral[]
  >([]);
  const [sentReferrals, setSentReferrals] = useState<ResidentReferral[]>([]);
  const [referralDate, setReferralDate] = useState<string>(() => localDateStr());
  const [showAllDates, setShowAllDates] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [selectedTargetBarangayId, setSelectedTargetBarangayId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedReferral, setSelectedReferral] =
    useState<ResidentReferral | null>(null);
  const [busyReferralId, setBusyReferralId] = useState<string | null>(null);
  const [pendingReferral, setPendingReferral] =
    useState<ResidentReferral | null>(null);

  const selectedTargetBarangay = targetBarangays.find(
    (barangay) => barangay.id === selectedTargetBarangayId
  );
  const localHasSlots = Boolean(localAvailability?.hasAvailableDoctor);
  const receivingHasSlots = Boolean(
    selectedTargetBarangay?.availability.hasAvailableDoctor
  );
  const canSubmit = Boolean(
    selectedResidentId &&
      selectedTargetBarangayId &&
      reason.trim() &&
      !localHasSlots &&
      receivingHasSlots
  );

  const loadReferrals = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/staff/referred-residents");
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to load referred residents.");
        return;
      }

      const data = json as StaffReferralsResponse;
      const nextTargets = data.targetBarangays || [];
      const preferredTarget =
        nextTargets.find((item) => item.availability.hasAvailableDoctor) ||
        nextTargets[0];

      setLocalAvailability(data.localAvailability || null);
      setTargetBarangays(nextTargets);
      setResidents(data.residents || []);
      setReceivedReferrals(data.receivedReferrals || []);
      setSentReferrals(data.sentReferrals || []);
      setSelectedTargetBarangayId(
        (current) => current || preferredTarget?.id || ""
      );
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const actOnReferral = async (id: string, action: "accept" | "reject") => {
    try {
      setBusyReferralId(id);
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
      await loadReferrals();
      setSelectedReferral(null);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setBusyReferralId(null);
    }
  };

  const submitReferral = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!canSubmit) {
      setError("Please complete the referral fields and check doctor slots.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/staff/referred-residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId: selectedResidentId,
          targetBarangayId: selectedTargetBarangayId,
          reason,
          notes,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to send referral.");
        return;
      }

      setMessage(json.message || "Resident referral sent.");
      setSelectedResidentId("");
      setReason("");
      setNotes("");
      await loadReferrals();
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-4">
      <Panel
        icon={<Send className="h-5 w-5" />}
        title="Referred Resident"
        subtitle="Send and receive resident referrals between barangays."
      >
        <div className="grid gap-4 md:grid-cols-4">
          <MiniStat
            label="Local Open Slots"
            value={String(localAvailability?.availableSlots ?? 0)}
          />
          <MiniStat
            label="Receiving Slots"
            value={String(
              selectedTargetBarangay?.availability.availableSlots ?? 0
            )}
          />
          <MiniStat label="Received" value={String(receivedReferrals.length)} />
          <MiniStat label="Sent" value={String(sentReferrals.length)} />
        </div>

        <form
          onSubmit={submitReferral}
          className="mt-5 rounded-[24px] border border-sky-200 bg-[#EFF6FF] p-5"
        >
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">Send Referral</h3>
              <p className="mt-1 text-sm text-slate-500">
                {selectedTargetBarangay
                  ? `Receiving barangay: ${selectedTargetBarangay.name}`
                  : "Select a receiving barangay"}
              </p>
            </div>

            <button
              type="button"
              onClick={loadReferrals}
              disabled={loading || submitting}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 text-sm font-bold text-sky-600 disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-2">
            {localHasSlots ? (
              <ReferralNotice tone="warning">
                Local doctors still have open slots.
              </ReferralNotice>
            ) : (
              <ReferralNotice tone="success">
                No open local doctor slots.
              </ReferralNotice>
            )}

            {selectedTargetBarangay?.availability.hasAvailableDoctor ? (
              <ReferralNotice tone="success">
                Receiving barangay has open doctor slots.
              </ReferralNotice>
            ) : (
              <ReferralNotice tone="warning">
                Receiving barangay has no open doctor slots.
              </ReferralNotice>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <ReferralSelect
              label="Resident"
              value={selectedResidentId}
              onChange={setSelectedResidentId}
              disabled={loading || submitting}
            >
              <option value="">Select resident</option>
              {residents.map((resident) => (
                <option key={resident.id} value={resident.id}>
                  {resident.fullName} ({resident.age || "-"} /{" "}
                  {resident.sex || "-"})
                </option>
              ))}
            </ReferralSelect>

            <ReferralSelect
              label="Receiving Barangay"
              value={selectedTargetBarangayId}
              onChange={setSelectedTargetBarangayId}
              disabled={loading || submitting}
            >
              <option value="">Select barangay</option>
              {targetBarangays.map((barangay) => (
                <option key={barangay.id} value={barangay.id}>
                  {barangay.name} - {barangay.availability.availableSlots}{" "}
                  slot(s)
                </option>
              ))}
            </ReferralSelect>

            <ReferralTextArea
              label="Referral Reason"
              value={reason}
              onChange={setReason}
              disabled={loading || submitting}
            />

            <ReferralTextArea
              label="Notes"
              value={notes}
              onChange={setNotes}
              disabled={loading || submitting}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="mt-5 inline-flex min-h-[50px] items-center gap-2 rounded-2xl bg-[#0EA5E9] px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Sending..." : "Send Referral"}
          </button>
        </form>
      </Panel>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50/60 px-4 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-black text-slate-700">
          <CalendarDays className="h-4 w-4 text-sky-600" />
          {showAllDates ? "Showing all referrals" : "Referrals for"}
        </span>
        {!showAllDates && (
          <>
            <input
              type="date"
              value={referralDate}
              max={localDateStr()}
              onChange={(e) => setReferralDate(e.target.value)}
              className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={() => setReferralDate(localDateStr())}
              className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
            >
              Today
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setShowAllDates((v) => !v)}
          className={`ml-auto rounded-xl px-3 py-2 text-xs font-bold transition ${
            showAllDates
              ? "bg-[#0EA5E9] text-white hover:bg-sky-600"
              : "border border-sky-200 bg-white text-sky-700 hover:bg-sky-100"
          }`}
        >
          {showAllDates ? "Back to daily view" : "Show all dates"}
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          icon={<Inbox className="h-5 w-5" />}
          title="Received Referrals"
          subtitle={showAllDates ? "Residents referred to this barangay." : "Referred to this barangay on the selected date."}
        >
          <ReferralList
            loading={loading}
            emptyText={showAllDates ? "No received referrals." : "No received referrals on this date."}
            referrals={showAllDates ? receivedReferrals : receivedReferrals.filter((r) => sameLocalDate(r.createdAt, referralDate))}
            direction="received"
            onView={setPendingReferral}
            onAct={actOnReferral}
            busyId={busyReferralId}
          />
        </Panel>

        <Panel
          icon={<ClipboardList className="h-5 w-5" />}
          title="Sent Referrals"
          subtitle={showAllDates ? "Residents sent to the other barangay." : "Sent to the other barangay on the selected date."}
        >
          <ReferralList
            loading={loading}
            emptyText={showAllDates ? "No sent referrals." : "No sent referrals on this date."}
            referrals={showAllDates ? sentReferrals : sentReferrals.filter((r) => sameLocalDate(r.createdAt, referralDate))}
            direction="sent"
            onView={setPendingReferral}
          />
        </Panel>
      </div>

      {selectedReferral && (
        <ReferralDetailsModal
          referral={selectedReferral}
          onClose={() => setSelectedReferral(null)}
        />
      )}

      {pendingReferral && (
        <PasswordGate
          residentName={getReferralResidentName(pendingReferral)}
          onCancel={() => setPendingReferral(null)}
          onVerified={() => {
            setSelectedReferral(pendingReferral);
            setPendingReferral(null);
          }}
        />
      )}
    </div>
  );
}

function Panel({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-[#EFF6FF] p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold text-sky-600">{value}</p>
    </div>
  );
}

function ReferralNotice({
  tone,
  children,
}: {
  tone: "success" | "warning";
  children: React.ReactNode;
}) {
  const isSuccess = tone === "success";
  return (
    <div
      className={`flex min-h-[48px] items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      <span>{children}</span>
    </div>
  );
}

function ReferralSelect({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase text-slate-500">
        {label}
      </label>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none disabled:opacity-60"
      >
        {children}
      </select>
    </div>
  );
}

function ReferralTextArea({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase text-slate-500">
        {label}
      </label>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none disabled:opacity-60"
      />
    </div>
  );
}

function ReferralList({
  loading,
  emptyText,
  referrals,
  direction,
  onView,
  onAct,
  busyId,
}: {
  loading: boolean;
  emptyText: string;
  referrals: ResidentReferral[];
  direction: "received" | "sent";
  onView: (referral: ResidentReferral) => void;
  onAct?: (id: string, action: "accept" | "reject") => void;
  busyId?: string | null;
}) {
  if (loading) {
    return <InlineLoader label="Loading referrals..." />;
  }

  if (referrals.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-sky-200 bg-sky-50 p-8 text-center text-sm font-semibold text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {referrals.map((referral) => (
        <ReferralCard
          key={referral.id}
          referral={referral}
          direction={direction}
          onView={onView}
          onAct={onAct}
          busy={busyId === referral.id}
        />
      ))}
    </div>
  );
}

function ReferralCard({
  referral,
  direction,
  onView,
  onAct,
  busy,
}: {
  referral: ResidentReferral;
  direction: "received" | "sent";
  onView: (referral: ResidentReferral) => void;
  onAct?: (id: string, action: "accept" | "reject") => void;
  busy?: boolean;
}) {
  const residentName = getReferralResidentName(referral);
  const barangayLabel =
    direction === "received"
      ? `From ${referral.sourceBarangay.name}`
      : `To ${referral.targetBarangay.name}`;

  return (
    <div className="rounded-[22px] border border-sky-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="break-words text-base font-black text-slate-900">
              {residentName}
            </h4>
            <ReferralStatusBadge status={referral.status} />
          </div>
          <p className="mt-1 text-sm font-semibold text-sky-600">
            {barangayLabel}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatReferralDateTime(referral.createdAt)}
          </p>
          {referral.reason && (
            <p className="mt-3 line-clamp-2 text-sm text-slate-600">
              {referral.reason}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onView(referral)}
          aria-label="View full info"
          title="View full info"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>

      {direction === "received" && referral.status === "PENDING" && onAct && (
        <div className="mt-3 flex gap-2 border-t border-sky-100 pt-3">
          <button
            type="button"
            onClick={() => onAct(referral.id, "accept")}
            disabled={busy}
            className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {busy ? "..." : "Accept"}
          </button>
          <button
            type="button"
            onClick={() => onAct(referral.id, "reject")}
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
}

type ReferralTabDiagnosis = {
  id: string;
  conditions?: string[] | null;
  isHealthy?: boolean;
  notes?: string | null;
  medicalAdvice?: string | null;
  createdAt: string;
  diagnosedBy?: { fullName?: string | null } | null;
};

function ReferralDetailsModal({
  referral,
  onClose,
}: {
  referral: ResidentReferral;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<
    "identifying" | "medical" | "family" | "social" | "assessment"
  >("identifying");
  const [diagnoses, setDiagnoses] = useState<ReferralTabDiagnosis[]>([]);
  const identifying = referral.identifyingData || {};
  const medical = (referral.medicalHistory || {}) as NonNullable<ReferralMedicalHistory>;
  const family = (referral.familyHistory || {}) as NonNullable<ReferralFamilyHistory>;
  const social = (referral.personalSocialHistory || {}) as NonNullable<ReferralSocialHistory>;

  const loadDiagnoses = useCallback(async () => {
    try {
      const res = await fetch(`/api/residents/${referral.residentId}/diagnoses`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok && Array.isArray(json)) setDiagnoses(json);
    } catch (err) {
      console.error("REFERRAL_TAB_DIAGNOSES_ERROR", err);
    }
  }, [referral.residentId]);

  useEffect(() => {
    loadDiagnoses();
  }, [loadDiagnoses]);

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
                {getReferralResidentName(referral)}
              </h2>
              <p className="truncate text-xs text-slate-500 sm:text-sm">
                {referral.sourceBarangay.name} → {referral.targetBarangay.name}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-stretch gap-1 rounded-2xl bg-sky-50 p-1">
            {[
              { id: "identifying", label: "Identity", icon: <IdCard className="h-5 w-5" /> },
              { id: "medical", label: "Medical", icon: <HeartPulse className="h-5 w-5" /> },
              { id: "family", label: "Family", icon: <Users className="h-5 w-5" /> },
              { id: "social", label: "Social", icon: <ClipboardList className="h-5 w-5" /> },
              { id: "assessment", label: "Assessment", icon: <Stethoscope className="h-5 w-5" /> },
            ].map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id as typeof tab)}
                  aria-label={t.label}
                  className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition ${
                    active
                      ? "bg-[#0EA5E9] text-white shadow-sm"
                      : "text-slate-500 hover:bg-white"
                  }`}
                >
                  {t.icon}
                  <span className="max-w-full truncate leading-none">
                    {t.label}
                  </span>
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
                    <QrInfoRow label="Birth Date" value={formatReferralDate(identifying.birthDate)} />
                    <QrInfoRow label="Civil Status" value={identifying.civilStatus} />
                    <QrInfoRow label="Religion" value={identifying.religion} />
                    <QrInfoRow label="Educational Attainment" value={identifying.educationalAttainment} />
                    <QrInfoRow label="Occupation" value={identifying.occupation} />
                  </QrInfoGroup>

                  <div className="space-y-6">
                    <QrInfoGroup title="Contact & Account" icon={<Phone className="h-4 w-4" />}>
                      <QrInfoRow label="Contact Number" value={identifying.contactNumber} />
                      <QrInfoRow label="Email" value={identifying.email} />
                      <QrInfoRow label="Phone Number" value={identifying.phoneNumber} />
                      <QrInfoRow label="Username" value={identifying.username} />
                      <QrInfoRow label="Verified Resident" value={identifying.isVerified ? "Yes" : "No"} />
                      <QrInfoRow label="Accompanying Person" value={identifying.accompanyingPerson} />
                      <QrInfoRow label="Relationship" value={identifying.relationship} />
                      <QrInfoRow label="Spouse Maiden Name" value={identifying.spouseMaidenName} />
                      <QrInfoRow label="Spouse Occupation" value={identifying.spouseOccupation} />
                      <QrInfoRow label="Spouse Contact Number" value={identifying.spouseContactNumber} />
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
      </div>
    </div>,
    document.body
  );
}


function ReferralStatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-black uppercase text-sky-600">
      {status || "PENDING"}
    </span>
  );
}

function getReferralResidentName(referral: ResidentReferral) {
  return (
    referral.identifyingData?.fullName ||
    `${referral.identifyingData?.firstName || ""} ${
      referral.identifyingData?.middleName || ""
    } ${referral.identifyingData?.lastName || ""}`
      .replace(/\s+/g, " ")
      .trim() ||
    "Resident"
  );
}


function formatReferralDate(value: unknown) {
  if (!value) return "N/A";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
}

function formatReferralDateTime(value: unknown) {
  if (!value) return "N/A";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}
