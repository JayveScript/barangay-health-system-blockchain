"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ProgressBar } from "@/components/dashboard/Charts";
import { PortalLoader } from "@/components/PortalLoader";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  HeartPulse,
  Inbox,
  LogOut,
  MapPin,
  Menu,
  Plus,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Megaphone,
  Send,
  Stethoscope,
  UserRound,
  UserPlus,
  Users,
  ScanLine,
  X,
} from "lucide-react";

type StaffUser = {
  id: string;
  fullName: string;
  username: string;
  role: "STAFF";
  email?: string | null;
  phoneNumber?: string | null;
  isVerified: boolean;
  barangay?: {
    name: string;
  } | null;
  createdAt: string;
};

import { QrScannerTab } from "@/components/QrScannerTab";
import { ProfileInfoPanel } from "@/components/dashboard/ProfileInfoPanel";
import { BMITab } from "@/components/dashboard/BMITab";

export default function StaffDashboardPage() {
  const [activeTab, setActiveTab] = useState<
  | "overview"
  | "personal"
  | "announcements"
  | "registration"
  | "referrals"
  | "scan-qr"
  | "logbook"
  | "bmi"
>("overview");
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();

        if (!res.ok || data.role !== "STAFF") {
          window.location.href = "/login";
          return;
        }

        setUser(data);
      } catch (error) {
        console.error("STAFF_DASHBOARD_ERROR", error);
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const initials = useMemo(() => {
    if (!user?.fullName) return "ST";
    return user.fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((name) => name[0]?.toUpperCase())
      .join("");
  }, [user]);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  if (loading) {
    return <PortalLoader label="Loading staff dashboard..." />;
  }

  if (!user) return null;

  const currentBarangayName = user.barangay?.name || "Assigned Barangay";

  return (
    <main className="h-screen overflow-hidden bg-[#EFF6FF] p-4 pb-[72px] sm:p-6 lg:pb-6">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="mx-auto flex h-full max-w-7xl gap-6 overflow-hidden">
        {/* Mobile sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[280px] transform rounded-r-[30px] border border-[#DCEAF7] bg-white/95 p-4 text-slate-800 shadow-2xl shadow-sky-900/10 transition-transform duration-300 lg:hidden ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Health Portal</h2>
                <p className="text-xs text-slate-500">Staff Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-slate-500 ring-1 ring-sky-200 hover:bg-sky-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col space-y-3 overflow-y-auto [&::-webkit-scrollbar]:hidden">
            <SidebarButton
              active={activeTab === "overview"}
              icon={<Activity className="h-5 w-5" />}
              label="Overview"
              onClick={() => {
                setActiveTab("overview");
                setMobileSidebarOpen(false);
              }}
            />
            <SidebarButton
              active={activeTab === "personal"}
              icon={<UserRound className="h-5 w-5" />}
              label="Personal Info"
              onClick={() => {
                setActiveTab("personal");
                setMobileSidebarOpen(false);
              }}
            />
            <SidebarButton
              active={activeTab === "announcements"}
              icon={<Megaphone className="h-5 w-5" />}
              label="Announcements"
              onClick={() => {
                setActiveTab("announcements");
                setMobileSidebarOpen(false);
              }}
            />
            <SidebarButton
              active={activeTab === "registration"}
              icon={<UserPlus className="h-5 w-5" />}
              label="Resident Registration"
              onClick={() => {
                setActiveTab("registration");
                setMobileSidebarOpen(false);
              }}
            />
            <SidebarButton
              active={activeTab === "referrals"}
              icon={<Send className="h-5 w-5" />}
              label="Referred Resident"
              onClick={() => {
                setActiveTab("referrals");
                setMobileSidebarOpen(false);
              }}
            />
            <SidebarButton
              active={activeTab === "scan-qr"}
              icon={<ScanLine className="h-5 w-5" />}
              label="Scan QR"
              onClick={() => {
                setActiveTab("scan-qr");
                setMobileSidebarOpen(false);
              }}
            />
            <SidebarButton
              active={activeTab === "logbook"}
              icon={<BookOpen className="h-5 w-5" />}
              label="Logbook"
              onClick={() => {
                setActiveTab("logbook");
                setMobileSidebarOpen(false);
              }}
            />
            <SidebarButton
              active={activeTab === "bmi"}
              icon={<Scale className="h-5 w-5" />}
              label="BMI Records"
              onClick={() => {
                setActiveTab("bmi");
                setMobileSidebarOpen(false);
              }}
            />
          </div>
        </aside>

        {/* Desktop sidebar */}
        <aside className="hidden h-full w-[240px] shrink-0 rounded-[30px] border border-[#DCEAF7] bg-white p-5 text-slate-800 shadow-2xl shadow-sky-900/10 lg:block">
          <div className="rounded-[24px] border border-sky-200 bg-sky-50/60 p-5">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Health Portal</h2>
                <p className="text-sm text-slate-500">Staff Dashboard</p>
              </div>
            </div>

            <div className="space-y-3">
              <SidebarButton
                active={activeTab === "overview"}
                icon={<Activity className="h-5 w-5" />}
                label="Overview"
                onClick={() => setActiveTab("overview")}
              />
              <SidebarButton
                active={activeTab === "personal"}
                icon={<UserRound className="h-5 w-5" />}
                label="Personal Info"
                onClick={() => setActiveTab("personal")}
              />
              <SidebarButton
  active={activeTab === "announcements"}
  icon={<Megaphone className="h-5 w-5" />}
  label="Announcements"
  onClick={() => setActiveTab("announcements")}
/>
              <SidebarButton
                active={activeTab === "registration"}
                icon={<UserPlus className="h-5 w-5" />}
                label="Resident Registration"
                onClick={() => setActiveTab("registration")}
              />
              <SidebarButton
                active={activeTab === "referrals"}
                icon={<Send className="h-5 w-5" />}
                label="Referred Resident"
                onClick={() => setActiveTab("referrals")}
              />
              <SidebarButton
                active={activeTab === "scan-qr"}
                icon={<ScanLine className="h-5 w-5" />}
                label="Scan QR"
                onClick={() => setActiveTab("scan-qr")}
              />
              <SidebarButton
                active={activeTab === "logbook"}
                icon={<BookOpen className="h-5 w-5" />}
                label="Logbook"
                onClick={() => setActiveTab("logbook")}
              />
              <SidebarButton
                active={activeTab === "bmi"}
                icon={<Scale className="h-5 w-5" />}
                label="BMI Records"
                onClick={() => setActiveTab("bmi")}
              />
            </div>
          </div>
        </aside>

        <section className="h-full flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto [transform:translateZ(0)] [will-change:transform] [backface-visibility:hidden] rounded-[30px] border border-[#DCEAF7] bg-white p-6 shadow-2xl shadow-sky-900/10">
            <div className="mb-6 overflow-hidden rounded-[24px] border border-sky-200 bg-gradient-to-br from-white to-sky-50 p-5 shadow-lg shadow-sky-900/5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  {/* Mobile hamburger menu button */}
                  <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="lg:hidden flex h-11 w-11 items-center justify-center rounded-xl bg-[#0EA5E9] text-white hover:bg-sky-600"
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-2xl font-extrabold text-sky-600">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <h1 className="max-w-full whitespace-nowrap text-lg font-extrabold text-slate-900 sm:text-3xl">
                        Dashboard
                      </h1>

                      <span className="w-fit shrink-0 rounded-full bg-[#0EA5E9] px-3 py-1 text-xs font-semibold text-white">
                        STAFF
                      </span>

                      {user.isVerified && (
                        <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified Account
                        </span>
                      )}

                      <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600">
                        <MapPin className="h-3.5 w-3.5" />
                        {currentBarangayName}
                      </span>
                    </div>

                    <p className="mt-1 max-w-full whitespace-nowrap text-xs uppercase tracking-wide text-slate-500 sm:text-sm">
                      {user.fullName}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>

            {activeTab === "overview" && <OverviewTab />}

{activeTab === "announcements" && <StaffAnnouncementsTab />}

{activeTab === "personal" && (
  <PersonalInfoTab user={user} initials={initials} />
)}

{activeTab === "registration" && (
  <StaffResidentRegistrationTab barangayName={currentBarangayName} />
)}

{activeTab === "referrals" && <StaffReferralsTab />}

{activeTab === "scan-qr" && (
  <div className="rounded-[24px] border border-sky-200 bg-white p-5">
    <QrScannerTab />
  </div>
)}

{activeTab === "logbook" && <StaffLogbookTab />}

{activeTab === "bmi" && <BMITab />}
          </div>
        </section>
      </div>

      <MobileBottomNav
        items={[
          { id: "overview", label: "Overview", icon: <Activity className="h-5 w-5" /> },
          { id: "personal", label: "Profile", icon: <UserRound className="h-5 w-5" /> },
          { id: "announcements", label: "News", icon: <Megaphone className="h-5 w-5" /> },
          { id: "registration", label: "Register", icon: <UserPlus className="h-5 w-5" /> },
          { id: "logbook", label: "Logbook", icon: <BookOpen className="h-5 w-5" /> },
          { id: "bmi", label: "BMI", icon: <Scale className="h-5 w-5" /> },
        ]}
        active={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
      />
    </main>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-5 pb-4">
      <div className="grid grid-cols-4 items-start gap-2 sm:gap-4">
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="Residents Assisted"
          value="84"
        />
        <MetricCard
          icon={<FileText className="h-5 w-5" />}
          label="Records Encoded"
          value="57"
        />
        <MetricCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Pending Tasks"
          value="14"
        />
        <MetricCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Daily Reports"
          value="6"
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Panel
          icon={<BarChart3 className="h-5 w-5" />}
          title="Staff Activity"
          subtitle="Monthly administrative support progress"
        >
          <div className="space-y-5">
            <ProgressBar label="Resident Assistance" value={80} />
            <ProgressBar label="Record Encoding" value={73} />
            <ProgressBar label="Document Preparation" value={61} />
            <ProgressBar label="Health Center Support" value={58} />
          </div>
        </Panel>

        <Panel
          icon={<Activity className="h-5 w-5" />}
          title="Staff Service Analytics"
          subtitle="Current health center support workload"
        >
          <div className="grid items-start gap-4 md:grid-cols-2">
            <MiniStat label="Open Tasks" value="14" />
            <MiniStat label="Completed Tasks" value="39" />
            <MiniStat label="Updated Records" value="57" />
            <MiniStat label="Prepared Forms" value="22" />
          </div>
        </Panel>
      </div>

      <Panel
        icon={<HeartPulse className="h-5 w-5" />}
        title="Health Center Staff Summary"
        subtitle="Assigned barangay support operations overview"
      >
        <div className="grid items-start gap-4 md:grid-cols-4">
          <SummaryBox title="Resident Requests" value="31" />
          <SummaryBox title="Encoded Profiles" value="57" />
          <SummaryBox title="Reports Filed" value="12" />
          <SummaryBox title="Assisted Visits" value="26" />
        </div>
      </Panel>
    </div>
  );
}

function PersonalInfoTab({
  user,
  initials,
}: {
  user: StaffUser;
  initials: string;
}) {
  return (
    <div className="space-y-5 pb-4">
      <ProfileInfoPanel
        fullName={user.fullName}
        initials={initials}
        roleLabel="Health Center Staff"
        username={user.username}
        email={user.email}
        phoneNumber={user.phoneNumber}
        barangayName={user.barangay?.name}
        isVerified={user.isVerified}
        createdAt={user.createdAt}
      />
    </div>
  );
}

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
  status: string;
  reason?: string | null;
  notes?: string | null;
  identifyingData: ReferralIdentifyingData;
  medicalHistory?: ReferralMedicalHistory;
  familyHistory?: ReferralFamilyHistory;
  personalSocialHistory?: ReferralSocialHistory;
  createdAt: string;
  sourceBarangay: {
    id: string;
    name: string;
    municipality?: string | null;
  };
  targetBarangay: {
    id: string;
    name: string;
    municipality?: string | null;
  };
  referredByStaff: {
    id: string;
    fullName?: string | null;
    username: string;
  };
};

type StaffReferralsResponse = {
  localAvailability: ReferralAvailabilitySummary;
  targetBarangays: ReferralBarangayOption[];
  residents: ReferralResidentOption[];
  receivedReferrals: ResidentReferral[];
  sentReferrals: ResidentReferral[];
};

function StaffReferralsTab() {
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
  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [selectedTargetBarangayId, setSelectedTargetBarangayId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedReferral, setSelectedReferral] =
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
        headers: {
          "Content-Type": "application/json",
        },
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
          <MiniStat
            label="Received"
            value={String(receivedReferrals.length)}
          />
          <MiniStat label="Sent" value={String(sentReferrals.length)} />
        </div>

        <form
          onSubmit={submitReferral}
          className="mt-5 rounded-[24px] border border-sky-200 bg-[#EFF6FF] p-5"
        >
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Send Referral
              </h3>
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
                  {barangay.name} - {barangay.availability.availableSlots} slot(s)
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

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          icon={<Inbox className="h-5 w-5" />}
          title="Received Referrals"
          subtitle="Residents referred to this barangay."
        >
          <ReferralList
            loading={loading}
            emptyText="No received referrals."
            referrals={receivedReferrals}
            direction="received"
            onView={setSelectedReferral}
          />
        </Panel>

        <Panel
          icon={<ClipboardList className="h-5 w-5" />}
          title="Sent Referrals"
          subtitle="Residents sent to the other barangay."
        >
          <ReferralList
            loading={loading}
            emptyText="No sent referrals."
            referrals={sentReferrals}
            direction="sent"
            onView={setSelectedReferral}
          />
        </Panel>
      </div>

      {selectedReferral && (
        <ReferralDetailsModal
          referral={selectedReferral}
          onClose={() => setSelectedReferral(null)}
        />
      )}
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
}: {
  loading: boolean;
  emptyText: string;
  referrals: ResidentReferral[];
  direction: "received" | "sent";
  onView: (referral: ResidentReferral) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-[24px] border border-sky-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
        Loading referrals...
      </div>
    );
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
        />
      ))}
    </div>
  );
}

function ReferralCard({
  referral,
  direction,
  onView,
}: {
  referral: ResidentReferral;
  direction: "received" | "sent";
  onView: (referral: ResidentReferral) => void;
}) {
  const residentName = getReferralResidentName(referral);
  const barangayLabel =
    direction === "received"
      ? `From ${referral.sourceBarangay.name}`
      : `To ${referral.targetBarangay.name}`;

  return (
    <div className="rounded-[22px] border border-sky-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-black text-slate-900">
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
          className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 text-sm font-bold text-sky-600 hover:bg-sky-100"
        >
          <Eye className="h-4 w-4" />
          View
        </button>
      </div>
    </div>
  );
}

function ReferralDetailsModal({
  referral,
  onClose,
}: {
  referral: ResidentReferral;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<
    "identifying" | "medical" | "family" | "social"
  >("identifying");
  const identifying = referral.identifyingData || {};
  const medical = (referral.medicalHistory || {}) as NonNullable<
    ReferralMedicalHistory
  >;
  const family = (referral.familyHistory || {}) as NonNullable<
    ReferralFamilyHistory
  >;
  const social = (referral.personalSocialHistory || {}) as NonNullable<
    ReferralSocialHistory
  >;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-sky-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-[#0EA5E9] to-sky-500 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-100">
                Referred Resident
              </p>
              <h2 className="mt-1 text-2xl font-black">
                {getReferralResidentName(referral)}
              </h2>
              <p className="mt-1 text-sm text-sky-100">
                {referral.sourceBarangay.name} to {referral.targetBarangay.name}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white/20 p-2 text-white ring-1 ring-white/25 hover:bg-white/30"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="border-b border-sky-200 bg-white px-5 pt-4">
          <div className="flex gap-2 overflow-x-auto">
            <ReferralModalTabButton
              active={tab === "identifying"}
              label="Identifying Data"
              onClick={() => setTab("identifying")}
            />
            <ReferralModalTabButton
              active={tab === "medical"}
              label="Medical History"
              onClick={() => setTab("medical")}
            />
            <ReferralModalTabButton
              active={tab === "family"}
              label="Family History"
              onClick={() => setTab("family")}
            />
            <ReferralModalTabButton
              active={tab === "social"}
              label="Personal / Social"
              onClick={() => setTab("social")}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-sky-50 p-5">
          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <ReferralDetailInfo label="Referral Reason" value={referral.reason} />
            <ReferralDetailInfo label="Notes" value={referral.notes} />
          </div>

          {tab === "identifying" && (
            <ReferralDetailSection icon={<UserRound className="h-5 w-5" />} title="Identifying Data">
              <ReferralDetailInfo label="Full Name" value={identifying.fullName} />
              <ReferralDetailInfo label="Age" value={identifying.age} />
              <ReferralDetailInfo label="Sex" value={identifying.sex} />
              <ReferralDetailInfo
                label="Birth Date"
                value={formatReferralDate(identifying.birthDate)}
              />
              <ReferralDetailInfo label="Civil Status" value={identifying.civilStatus} />
              <ReferralDetailInfo label="Religion" value={identifying.religion} />
              <ReferralDetailInfo label="Educational Attainment" value={identifying.educationalAttainment} />
              <ReferralDetailInfo label="Occupation" value={identifying.occupation} />
              <ReferralDetailInfo label="Contact Number" value={identifying.contactNumber} />
              <ReferralDetailInfo label="Email" value={identifying.email} />
              <ReferralDetailInfo label="Phone Number" value={identifying.phoneNumber} />
              <ReferralDetailInfo label="Username" value={identifying.username} />
              <ReferralDetailInfo label="Verified Resident" value={identifying.isVerified} />
              <ReferralDetailInfo label="House / Street" value={identifying.houseStreet} />
              <ReferralDetailInfo label="Complete Address" value={identifying.completeAddress} />
              <ReferralDetailInfo label="Barangay" value={identifying.barangayName} />
              <ReferralDetailInfo label="City" value={identifying.city} />
              <ReferralDetailInfo label="Accompanying Person" value={identifying.accompanyingPerson} />
              <ReferralDetailInfo label="Relationship" value={identifying.relationship} />
              <ReferralDetailInfo label="Spouse Maiden Name" value={identifying.spouseMaidenName} />
              <ReferralDetailInfo label="Spouse Occupation" value={identifying.spouseOccupation} />
              <ReferralDetailInfo label="Spouse Contact Number" value={identifying.spouseContactNumber} />
            </ReferralDetailSection>
          )}

          {tab === "medical" && (
            <ReferralDetailSection icon={<Stethoscope className="h-5 w-5" />} title="Past Medical History">
              <ReferralDetailInfo label="Hypertension" value={medical.hasHypertension} />
              <ReferralDetailInfo label="Diabetes" value={medical.hasDiabetes} />
              <ReferralDetailInfo label="STI / HIV" value={medical.hasStiHiv} />
              <ReferralDetailInfo label="Heart Disease" value={medical.hasHeartDisease} />
              <ReferralDetailInfo label="Kidney Failure" value={medical.hasKidneyFailure} />
              <ReferralDetailInfo label="Tuberculosis" value={medical.hasTuberculosis} />
              <ReferralDetailInfo label="Allergies" value={medical.hasAllergies} />
              <ReferralDetailInfo label="Allergies Details" value={medical.allergiesDetails} />
              <ReferralDetailInfo label="Cancer" value={medical.hasCancer} />
              <ReferralDetailInfo label="Cancer Details" value={medical.cancerDetails} />
              <ReferralDetailInfo label="Other Conditions" value={medical.hasOtherConditions} />
              <ReferralDetailInfo label="Other Conditions Details" value={medical.otherConditionsDetails} />
              <ReferralDetailInfo label="Maintenance Medications" value={medical.maintenanceMedications} />
              <ReferralDetailInfo label="Previous Illnesses / Surgeries" value={medical.previousIllnessesSurgeries} />
            </ReferralDetailSection>
          )}

          {tab === "family" && (
            <ReferralDetailSection icon={<Users className="h-5 w-5" />} title="Family History">
              <ReferralDetailInfo label="Asthma / Allergies" value={family.asthmaAllergies} />
              <ReferralDetailInfo label="Birth Defects" value={family.birthDefects} />
              <ReferralDetailInfo label="Cancer" value={family.cancer} />
              <ReferralDetailInfo label="Dementia" value={family.dementia} />
              <ReferralDetailInfo label="Diabetes" value={family.diabetes} />
              <ReferralDetailInfo label="Hypertension" value={family.hypertension} />
              <ReferralDetailInfo label="Kidney Disease" value={family.kidneyDisease} />
              <ReferralDetailInfo label="Mental Illness" value={family.mentalIllness} />
            </ReferralDetailSection>
          )}

          {tab === "social" && (
            <ReferralDetailSection icon={<Activity className="h-5 w-5" />} title="Personal / Social History">
              <ReferralDetailInfo label="Eats Healthy Diet" value={social.eatsHealthyDiet} />
              <ReferralDetailInfo label="Adequate Physical Activity" value={social.adequatePhysicalActivity} />
              <ReferralDetailInfo label="Sufficient Rest / Sleep" value={social.sufficientRestSleep} />
              <ReferralDetailInfo label="Normal Growth / Development" value={social.normalGrowthDevelopment} />
              <ReferralDetailInfo label="Multiple Sex Partners" value={social.multipleSexPartners} />
              <ReferralDetailInfo label="Smokes Tobacco" value={social.smokesTobacco} />
              <ReferralDetailInfo label="Tobacco Packs Per Year" value={social.tobaccoPacksPerYear} />
              <ReferralDetailInfo label="Drinks Alcohol" value={social.drinksAlcohol} />
              <ReferralDetailInfo label="Alcohol Bottles Per Day" value={social.alcoholBottlesPerDay} />
              <ReferralDetailInfo label="Takes Illicit Drugs" value={social.takesIllicitDrugs} />
              <ReferralDetailInfo label="Illicit Drugs Details" value={social.illicitDrugsDetails} />
            </ReferralDetailSection>
          )}
        </div>
      </div>
    </div>
  );
}

function ReferralModalTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-t-2xl px-4 py-3 text-sm font-black transition ${
        active
          ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
          : "bg-sky-50 text-sky-600 hover:bg-sky-100"
      }`}
    >
      {label}
    </button>
  );
}

function ReferralDetailSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          {icon}
        </div>
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function ReferralDetailInfo({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {formatReferralValue(value)}
      </p>
    </div>
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

function formatReferralValue(value: unknown) {
  if (typeof value === "boolean") return yesNoText(value);
  if (value === null || value === undefined || String(value).trim() === "") {
    return "N/A";
  }
  return String(value);
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

type StaffRegistrationForm = {
  lastName: string;
  firstName: string;
  middleName: string;
  age: string;
  sex: "MALE" | "FEMALE" | "";
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

const staffStepLabels = [
  "Identifying Data",
  "Past Medical History",
  "Family History",
  "Personal / Social History",
  "Review Summary",
];

const initialStaffRegistrationForm: StaffRegistrationForm = {
  lastName: "",
  firstName: "",
  middleName: "",
  age: "",
  sex: "",
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

function StaffResidentRegistrationTab({
  barangayName,
}: {
  barangayName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5 pb-4">
      <Panel
        icon={<UserPlus className="h-5 w-5" />}
        title="Resident Registration"
        subtitle="Register walk-in residents without account verification."
      >
        <div className="rounded-[24px] border border-sky-200 bg-[#EFF6FF] p-5">
          <h3 className="text-2xl font-extrabold text-slate-900">
            New Resident Entry
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            This flow uses the same health registration structure but removes Step
            5. Staff can directly save to the database.
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
      </Panel>

      {open && (
        <StaffRegistrationModal
          barangayName={barangayName}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function StaffRegistrationModal({
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
  const [form, setForm] = useState<StaffRegistrationForm>(
    initialStaffRegistrationForm
  );

  const updateField = <K extends keyof StaffRegistrationForm>(
    key: K,
    value: StaffRegistrationForm[K]
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
    if (!form.lastName || !form.firstName || !form.birthDate || !form.sex || !form.civilStatus || !form.houseStreet) {
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
      setForm(initialStaffRegistrationForm);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-sky-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-sky-200 bg-sky-50/60 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-sky-600">
              Resident Registration (Staff)
            </p>
            <h3 className="text-2xl font-black text-slate-900">
              {staffStepLabels[step - 1]}
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
            {staffStepLabels.map((label, idx) => {
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

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
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
                  onChange={(e) => updateField("sex", e.target.value as StaffRegistrationForm["sex"])}
                  className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none"
                >
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Civil Status *</label>
                <select
                  value={form.civilStatus}
                  onChange={(e) => updateField("civilStatus", e.target.value as StaffRegistrationForm["civilStatus"])}
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
              <ModalInput label="House / Street *" value={form.houseStreet} onChange={(v) => updateField("houseStreet", v)} />
              <ModalInput label="Contact Number" value={form.contactNumber} onChange={(v) => updateField("contactNumber", v)} />
              <ModalInput label="Religion" value={form.religion} onChange={(v) => updateField("religion", v)} />
              <ModalInput label="Educational Attainment" value={form.educationalAttainment} onChange={(v) => updateField("educationalAttainment", v)} />
              <ModalInput label="Occupation" value={form.occupation} onChange={(v) => updateField("occupation", v)} />
              <ModalInput label="Accompanying Person" value={form.accompanyingPerson} onChange={(v) => updateField("accompanyingPerson", v)} />
              <ModalInput label="Relationship" value={form.relationship} onChange={(v) => updateField("relationship", v)} />
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

        <div className="border-t border-slate-200 p-5">
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

type Announcement = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  publishDate: string;
  createdAt?: string;
};

function StaffAnnouncementsTab() {
  const today = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/admin/announcements?date=${selectedDate}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to load announcements.");
        return;
      }

      setAnnouncements(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [selectedDate]);

  return (
    <div className="space-y-5 pb-4">
      <Panel
        icon={<Megaphone className="h-5 w-5" />}
        title="Health Center Announcements"
        subtitle="View today's, past, and upcoming announcements from the admin."
      >
        <div className="mb-5 flex flex-col gap-4 rounded-[24px] border border-sky-200 bg-[#EFF6FF] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Announcements for {formatAnnouncementDate(selectedDate)}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Use the calendar to view announcements for another date.
            </p>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-sky-200">
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              Calendar Date
            </label>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="min-h-[46px] rounded-xl border border-sky-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-[24px] border border-sky-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 to-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-200">
              <Megaphone className="h-9 w-9" />
            </div>

            <h3 className="text-2xl font-black text-slate-900">
              No announcement
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              There is no announcement for this selected date.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-[26px] border border-sky-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {item.imageUrl ? (
                  <div className="bg-slate-100">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="max-h-[360px] w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-44 items-center justify-center bg-gradient-to-br from-sky-50 to-white text-sky-600">
                    <Megaphone className="h-14 w-14" />
                  </div>
                )}

                <div className="p-5">
                  <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-600">
                    {formatAnnouncementDate(item.publishDate)}
                  </span>

                  <h3 className="mt-3 text-2xl font-black text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {item.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

type LogbookEntry = {
  id: string;
  name: string;
  purpose: string;
  visitDate: string;
  createdAt: string;
};

function StaffLogbookTab() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", purpose: "" });

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/logbook?date=${selectedDate}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Failed to load logbook."); return; }
      setEntries(Array.isArray(json) ? json : []);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, [selectedDate]);

  const submitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.name.trim() || !form.purpose.trim()) {
      setError("Name and Purpose are required.");
      return;
    }
    try {
      setSubmitting(true);
      const visitDate = new Date().toISOString();
      const res = await fetch("/api/logbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), purpose: form.purpose.trim(), visitDate }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Failed to add entry."); return; }
      setSuccess("Visitor logged successfully.");
      setForm({ name: "", purpose: "" });
      await fetchEntries();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = entries.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.purpose.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-4">
      <Panel
        icon={<BookOpen className="h-5 w-5" />}
        title="Health Center Logbook"
        subtitle="Track visitors entering the health center — date, time, name, and purpose."
      >
        {/* Date Filter + Search */}
        <div className="mb-5 flex flex-col gap-4 rounded-[24px] border border-sky-200 bg-[#EFF6FF] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Logbook for {formatAnnouncementDate(selectedDate)}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {filtered.length} visitor{filtered.length !== 1 ? "s" : ""} recorded
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search visitor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-[46px] rounded-xl border border-sky-200 bg-white pl-9 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
              />
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-sky-200">
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
                Filter Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="min-h-[38px] rounded-xl border border-sky-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-sky-500"
              />
            </div>
            <button
              type="button"
              onClick={fetchEntries}
              disabled={loading}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 text-sm font-bold text-sky-600 hover:bg-sky-50 disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Add Entry Form */}
        <form
          onSubmit={submitEntry}
          className="mb-5 rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Log a Visitor</h4>
              <p className="text-xs text-slate-500">Fill in visitor details and click Add Entry.</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {success}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Full Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Juan Dela Cruz"
                className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Purpose of Visit *
              </label>
              <input
                type="text"
                value={form.purpose}
                onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                placeholder="e.g. Check-up, Consultation"
                className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
          </div>

          <p className="mt-3 text-xs font-semibold text-slate-400">
            Date and time will be recorded automatically at the moment of entry.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-[#0EA5E9] px-6 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {submitting ? "Saving..." : "Add Entry"}
          </button>
        </form>

        {/* Logbook Table */}
        {loading ? (
          <div className="rounded-[24px] border border-sky-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            Loading logbook entries...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 to-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-200">
              <BookOpen className="h-9 w-9" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">No Entries</h3>
            <p className="mt-2 text-sm text-slate-500">No visitors logged for this date.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-sky-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-sky-100 bg-sky-50">
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">#</th>
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">Date</th>
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">Time</th>
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">Name</th>
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-50">
                  {filtered.map((entry, idx) => {
                    const dt = new Date(entry.visitDate);
                    const dateStr = dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
                    const timeStr = dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
                    return (
                      <tr key={entry.id} className="transition hover:bg-sky-50/50">
                        <td className="px-5 py-4 font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-xl bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                            {dateStr}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            {timeStr}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900">{entry.name}</td>
                        <td className="px-5 py-4 text-slate-600">{entry.purpose}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

function formatAnnouncementDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function SidebarButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
        active
          ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
          : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
      }`}
    >
      {/* 🔵 FIX ICON ALIGNMENT */}
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
      </span>

      <span className="leading-none">{label}</span>
    </button>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl sm:rounded-[24px] border border-sky-200 bg-white p-2 sm:p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
      <div className="mb-2 sm:mb-4 flex h-6 w-6 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-2xl bg-sky-50 text-sky-600">
        {icon}
      </div>
      <div>
        <p className="text-[8px] sm:text-sm font-semibold text-slate-500 leading-tight line-clamp-2">{label}</p>
        <p className="mt-0.5 sm:mt-1 text-base sm:text-3xl font-extrabold text-slate-900 line-clamp-1">{value}</p>
      </div>
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

function SummaryBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-white to-[#EFF6FF] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

