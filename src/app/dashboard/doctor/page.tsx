"use client";

import { useEffect, useMemo, useState } from "react";
import { InlineLoader } from "@/components/dashboard/InlineLoader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PortalLoader } from "@/components/PortalLoader";
import { DonutChart, BarList } from "@/components/dashboard/Charts";
import { ReferralInbox } from "@/components/dashboard/ReferralInbox";
import {
  Activity,
  BarChart3,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  HeartPulse,
  Inbox,
  LogOut,
  MapPin,
  Menu,
  Megaphone,
MessageSquareText,
Send,
  Plus,
  Save,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  ScanLine,
  X,
  XCircle,
} from "lucide-react";

type DoctorUser = {
  id: string;
  fullName: string;
  username: string;
  role: "DOCTOR";
  email?: string | null;
  phoneNumber?: string | null;
  isVerified: boolean;
  barangay?: {
    name: string;
  } | null;
  createdAt: string;
};

type ResidentMedicalHistory = {
  hasHypertension?: boolean;
  hasDiabetes?: boolean;
  hasStiHiv?: boolean;
  hasHeartDisease?: boolean;
  hasKidneyFailure?: boolean;
  hasTuberculosis?: boolean;
  hasAllergies?: boolean;
  allergiesDetails?: string | null;
  hasCancer?: boolean;
  cancerDetails?: string | null;
  hasOtherConditions?: boolean;
  otherConditionsDetails?: string | null;
  maintenanceMedications?: string | null;
  previousIllnessesSurgeries?: string | null;
} | null;

type ResidentFamilyHistory = {
  asthmaAllergies?: boolean;
  birthDefects?: boolean;
  cancer?: boolean;
  dementia?: boolean;
  diabetes?: boolean;
  hypertension?: boolean;
  kidneyDisease?: boolean;
  mentalIllness?: boolean;
} | null;

type ResidentSocialHistory = {
  eatsHealthyDiet?: boolean;
  adequatePhysicalActivity?: boolean;
  sufficientRestSleep?: boolean;
  normalGrowthDevelopment?: boolean;
  multipleSexPartners?: boolean;
  smokesTobacco?: boolean;
  tobaccoPacksPerYear?: string | null;
  drinksAlcohol?: boolean;
  alcoholBottlesPerDay?: string | null;
  takesIllicitDrugs?: boolean;
  illicitDrugsDetails?: string | null;
} | null;

type DoctorAppointment = {
  id: string;
  time: string;
  reason: string;
  otherReason?: string | null;
  status: string;
  queueNumber?: number;
  suggestion?: string | null;
  resident?: {
    id?: string;
    fullName?: string;
    firstName?: string;
    middleName?: string | null;
    lastName?: string;
    age?: number;
    sex?: string;
    birthDate?: string;
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
    isVerified?: boolean;
    medicalHistory?: ResidentMedicalHistory;
    familyHistory?: ResidentFamilyHistory;
    personalSocialHistory?: ResidentSocialHistory;
  } | null;
};

type DoctorAvailability = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  slots: {
    time: string;
    queueNumber: number;
  }[];
  appointments: DoctorAppointment[];
  createdAt: string;
  remainingSlots: number;
  totalSlots: number;
};

import { QrScannerTab } from "@/components/QrScannerTab";
import { ProfileInfoPanel } from "@/components/dashboard/ProfileInfoPanel";
import { DiagnoseTab } from "@/components/dashboard/DiagnoseTab";
import { AnnouncementsManager } from "@/components/dashboard/AnnouncementsManager";
import { RegisteredResidentsTab } from "@/components/dashboard/RegisteredResidentsTab";

export default function DoctorDashboardPage() {
  const [activeTab, setActiveTab] = useState<
  "overview" | "personal" | "residents" | "appointments" | "referrals" | "diagnose" | "announcements" | "scan-qr"
>("overview");

  const [user, setUser] = useState<DoctorUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();

        if (!res.ok || data.role !== "DOCTOR") {
          window.location.href = "/login";
          return;
        }

        setUser(data);
      } catch (error) {
        console.error("DOCTOR_DASHBOARD_ERROR", error);
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }

      
    }

    loadUser();
  }, []);

  const initials = useMemo(() => {
    if (!user?.fullName) return "DR";
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
    return <PortalLoader label="Loading doctor dashboard..." />;
  }

  if (!user) return null;

  const currentBarangayName = user.barangay?.name || "Assigned Barangay";

  return (
    <main className="min-h-screen bg-[#EFF6FF] p-4 pb-[72px] sm:p-6 lg:h-screen lg:overflow-hidden lg:pb-6">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="mx-auto flex h-full max-w-7xl flex-col gap-6 lg:flex-row">
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
                <p className="text-xs text-slate-500">Doctor Dashboard</p>
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
              active={activeTab === "appointments"}
              icon={<CalendarCheck className="h-5 w-5" />}
              label="Appointments"
              onClick={() => {
                setActiveTab("appointments");
                setMobileSidebarOpen(false);
              }}
            />

            <SidebarButton
              active={activeTab === "referrals"}
              icon={<Inbox className="h-5 w-5" />}
              label="Referrals"
              onClick={() => {
                setActiveTab("referrals");
                setMobileSidebarOpen(false);
              }}
            />

            <SidebarButton
              active={activeTab === "diagnose"}
              icon={<Stethoscope className="h-5 w-5" />}
              label="Diagnose Patient"
              onClick={() => {
                setActiveTab("diagnose");
                setMobileSidebarOpen(false);
              }}
            />

            <SidebarButton
              active={activeTab === "announcements"}
              icon={<Megaphone className="h-6 w-6" />}
              label="Announcements"
              onClick={() => {
                setActiveTab("announcements");
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
              active={activeTab === "residents"}
              icon={<Users className="h-5 w-5" />}
              label="Registered Residents"
              onClick={() => {
                setActiveTab("residents");
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
          </div>
        </aside>

        <aside className="hidden shrink-0 rounded-[30px] border border-[#DCEAF7] bg-white p-4 text-slate-800 shadow-2xl shadow-sky-900/10 lg:block lg:h-full lg:w-[240px] lg:p-5 lg:overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <div className="rounded-[24px] border border-sky-200 bg-sky-50/60 p-4 lg:p-5">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25">
                <HeartPulse className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold">Health Portal</h2>
                <p className="text-sm text-slate-500">Doctor Dashboard</p>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <SidebarButton
                active={activeTab === "overview"}
                icon={<Activity className="h-5 w-5" />}
                label="Overview"
                onClick={() => setActiveTab("overview")}
              />

              <SidebarButton
                active={activeTab === "appointments"}
                icon={<CalendarCheck className="h-5 w-5" />}
                label="Appointments"
                onClick={() => setActiveTab("appointments")}
              />

              <SidebarButton
                active={activeTab === "referrals"}
                icon={<Inbox className="h-5 w-5" />}
                label="Referrals"
                onClick={() => setActiveTab("referrals")}
              />

              <SidebarButton
                active={activeTab === "diagnose"}
                icon={<Stethoscope className="h-5 w-5" />}
                label="Diagnose Patient"
                onClick={() => setActiveTab("diagnose")}
              />

              <SidebarButton
  active={activeTab === "announcements"}
  icon={<Megaphone className="h-6 w-6" />}
  label="Announcements"
  onClick={() => setActiveTab("announcements")}
/>

              <SidebarButton
                active={activeTab === "personal"}
                icon={<UserRound className="h-5 w-5" />}
                label="Personal Info"
                onClick={() => setActiveTab("personal")}
              />

              <SidebarButton
                active={activeTab === "residents"}
                icon={<Users className="h-5 w-5" />}
                label="Registered Residents"
                onClick={() => setActiveTab("residents")}
              />

              <SidebarButton
                active={activeTab === "scan-qr"}
                icon={<ScanLine className="h-5 w-5" />}
                label="Scan QR"
                onClick={() => setActiveTab("scan-qr")}
              />
            </div>
          </div>
        </aside>

        <section className="flex-1 overflow-y-auto lg:h-full [transform:translateZ(0)]">
          <div className="min-h-full [transform:translateZ(0)] [will-change:transform] [backface-visibility:hidden] rounded-[30px] border border-[#DCEAF7] bg-white p-4 shadow-2xl shadow-sky-900/10 sm:p-6">
            <div className="mb-6 overflow-hidden rounded-[24px] border border-sky-200 bg-gradient-to-br from-white to-sky-50 p-4 shadow-lg shadow-sky-900/5 sm:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
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
                        DOCTOR
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

            {activeTab === "residents" && <RegisteredResidentsTab />}

            {activeTab === "appointments" && <AppointmentsTab />}

            {activeTab === "referrals" && (
              <ReferralInbox
                title="Referred Residents"
                subtitle="Residents referred to your barangay — accept or reject."
              />
            )}

            {activeTab === "diagnose" && <DiagnoseTab />}

            {activeTab === "announcements" && (
              <AnnouncementsManager subtitle="Post and view announcements for your barangay." />
            )}

            {activeTab === "scan-qr" && (
              <div className="rounded-[24px] border border-sky-200 bg-white p-5">
                <QrScannerTab />
              </div>
            )}

            {activeTab === "personal" && (
              <PersonalInfoTab user={user} initials={initials} />
            )}
          </div>
        </section>
      </div>

      <MobileBottomNav
        items={[
          { id: "overview", label: "Overview", icon: <Activity className="h-5 w-5" /> },
          { id: "residents", label: "Residents", icon: <Users className="h-5 w-5" /> },
          { id: "appointments", label: "Schedule", icon: <CalendarCheck className="h-5 w-5" /> },
          { id: "referrals", label: "Referrals", icon: <Inbox className="h-5 w-5" /> },
          { id: "diagnose", label: "Diagnose", icon: <Stethoscope className="h-5 w-5" /> },
          { id: "announcements", label: "News", icon: <Megaphone className="h-6 w-6" /> },
          { id: "personal", label: "Profile", icon: <UserRound className="h-5 w-5" /> },
          { id: "scan-qr", label: "Scan QR", icon: <ScanLine className="h-5 w-5" /> },
        ]}
        active={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
      />
    </main>
  );
}

function AppointmentsTab() {
  const [items, setItems] = useState<DoctorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<DoctorAppointment | null>(null);
    const [suggestionAppointment, setSuggestionAppointment] =
  useState<DoctorAppointment | null>(null);

  const [form, setForm] = useState({
    date: "",
    startTime: "10:00",
    endTime: "16:00",
    slotMinutes: "30",
  });

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/doctor/appointments");
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to load appointments.");
        return;
      }

      setItems(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handlePostAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setFormLoading(true);

      const res = await fetch("/api/doctor/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          slotMinutes: Number(form.slotMinutes),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to post availability.");
        return;
      }

      setMessage("Availability posted successfully.");
      setForm((prev) => ({ ...prev, date: "" }));
      await fetchAppointments();
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setFormLoading(false);
    }
  };

  const updateAppointmentStatus = async (
    appointmentId: string,
    status: "ACCEPTED" | "REJECTED"
  ) => {
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/doctor/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to update appointment.");
        return;
      }

      setMessage(
        status === "ACCEPTED"
          ? "Appointment accepted successfully."
          : "Appointment rejected successfully."
      );

      await fetchAppointments();
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    }
  };

  const saveAppointmentSuggestion = async (
  appointmentId: string,
  suggestion: string
) => {
  setMessage("");
  setError("");

  try {
    const res = await fetch(`/api/doctor/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ suggestion }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Failed to save suggestion.");
      return false;
    }

    setMessage("Suggestion saved successfully.");
    await fetchAppointments();
    return true;
  } catch (err) {
    console.error(err);
    setError("Unable to connect to the server.");
    return false;
  }
};

  const postedSchedules = items.length;

  const totalSlots = items.reduce((total, item) => {
    return total + (item.remainingSlots || 0);
  }, 0);

  const pendingAppointments = items.reduce((total, item) => {
    return (
      total + item.appointments.filter((app) => app.status === "PENDING").length
    );
  }, 0);

  const acceptedAppointments = items.reduce((total, item) => {
    return (
      total +
      item.appointments.filter((app) => app.status === "ACCEPTED").length
    );
  }, 0);

  return (
    <div className="space-y-5 pb-4">
      <div className="grid grid-cols-4 items-start gap-2 sm:gap-4">
        <MetricCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Posted Schedules"
          value={String(postedSchedules)}
        />

        <MetricCard
          icon={<Clock className="h-5 w-5" />}
          label="Open Slots"
          value={String(totalSlots)}
        />

        <MetricCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Pending Requests"
          value={String(pendingAppointments)}
        />

        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Accepted"
          value={String(acceptedAppointments)}
        />
      </div>

      <Panel
        icon={<Plus className="h-5 w-5" />}
        title="Post Available Time"
        subtitle="Create your on-duty schedule for residents to book appointments."
      >
        <form onSubmit={handlePostAvailability} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 items-start gap-4">
            <FormInput
              label="Date"
              type="date"
              value={form.date}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, date: value }))
              }
            />

            <FormInput
              label="Start Time"
              type="time"
              value={form.startTime}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, startTime: value }))
              }
            />

            <FormInput
              label="End Time"
              type="time"
              value={form.endTime}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, endTime: value }))
              }
            />

            <FormInput
              label="Minutes Per Person"
              type="number"
              value={form.slotMinutes}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, slotMinutes: value }))
              }
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={formLoading}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#0EA5E9] px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-60"
          >
            <CalendarCheck className="h-4 w-4" />
            {formLoading ? "Posting..." : "Post Availability"}
          </button>
        </form>
      </Panel>

      <Panel
        icon={<CalendarDays className="h-5 w-5" />}
        title="Appointment Requests"
        subtitle="Accept or reject resident appointment requests."
      >
        {loading ? (
          <InlineLoader label="Loading appointments..." />
        ) : items.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-sky-200 bg-[#EFF6FF] p-8 text-center">
            <p className="text-lg font-extrabold text-slate-900">
              No availability posted yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Post your available duty time so residents can request
              appointments.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-[26px] border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-sky-50 p-5 shadow-sm"
              >
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-xl font-extrabold text-slate-900">
                      {formatLongDate(item.date)}
                    </h4>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {formatTime(item.startTime)} - {formatTime(item.endTime)} •{" "}
                      {item.slotMinutes} minutes per resident
                    </p>
                  </div>

                  <span className="rounded-full bg-[#0EA5E9] px-4 py-2 text-xs font-black uppercase tracking-wide text-white">
                    {item.remainingSlots} slots left
                  </span>
                </div>

                {item.appointments.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-500">
                    No resident requests yet.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
  <table className="w-full text-sm border-collapse">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
  <tr className="text-center">
    <th className="px-4 py-4 font-bold">Queue #</th>
    <th className="px-4 py-4 font-bold">Time</th>
    <th className="px-4 py-4 font-bold">Resident</th>
    <th className="px-4 py-4 font-bold">Status</th>
    <th className="px-4 py-4 font-bold">Action</th>
  </tr>
</thead>

                      <tbody className="divide-y divide-slate-100">
  {item.appointments.map((appointment) => (
    <tr key={appointment.id} className="bg-white text-center">
      
      <td className="px-4 py-5">
        <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-sky-50 px-3 text-sm font-black text-sky-600">
          #{appointment.queueNumber || "-"}
        </span>
      </td>

      <td className="px-4 py-5 font-black text-sky-600">
        {formatTime(appointment.time)}
      </td>

      <td className="px-4 py-5 font-black text-slate-900">
        {getResidentName(appointment)}
      </td>

      <td className="px-4 py-5">
        <StatusBadge status={appointment.status} />
      </td>

      <td className="px-4 py-5">
  <div className="flex justify-center gap-2">
    <button
      type="button"
      title="View Details"
      onClick={() => setSelectedAppointment(appointment)}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition hover:bg-sky-100"
    >
      <Eye className="h-4 w-4" />
    </button>

    <button
      type="button"
      title="Suggestion"
      onClick={() => setSuggestionAppointment(appointment)}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition ${
        appointment.suggestion
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
      }`}
    >
      <MessageSquareText className="h-4 w-4" />
    </button>

    {appointment.status === "PENDING" && (
      <>
        <button
          type="button"
          title="Accept"
          onClick={() => updateAppointmentStatus(appointment.id, "ACCEPTED")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700"
        >
          <CheckCircle2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          title="Reject"
          onClick={() => updateAppointmentStatus(appointment.id, "REJECTED")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white transition hover:bg-red-700"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </>
    )}
  </div>
</td>

    </tr>
  ))}
</tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {selectedAppointment && (
        <ResidentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
{suggestionAppointment && (
  <SuggestionModal
    appointment={suggestionAppointment}
    onClose={() => setSuggestionAppointment(null)}
    onSave={saveAppointmentSuggestion}
  />
)}

    </div>
  );
}

type DoctorDashboardData = {
  stats: {
    totalResidents: number;
    medicalRecords: number;
    totalAppointments: number;
  };
  gender: {
    male: number;
    female: number;
    other: number;
  };
  appointments: {
    pending: number;
    accepted: number;
    rejected: number;
  };
  conditions: {
    hypertension: number;
    diabetes: number;
    tuberculosis: number;
    heartDisease: number;
    allergies: number;
    cancer: number;
  };
  todaySlots: {
    totalSlots: number;
    openSlots: number;
    bookedSlots: number;
    postedSchedules: number;
  };
};


type OverviewResident = NonNullable<DoctorAppointment["resident"]>;

function OverviewTab() {
  const [dashboardData, setDashboardData] = useState<DoctorDashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        setLoading(true);

        const res = await fetch("/api/doctor/dashboard");
        const json = await res.json();

        if (res.ok) {
          setDashboardData(json);
        }
      } catch (error) {
        console.error("OVERVIEW_LOAD_ERROR", error);
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, []);

  const stats = {
    totalResidents: dashboardData?.stats.totalResidents ?? 0,
    medicalRecords: dashboardData?.stats.medicalRecords ?? 0,
    totalAppointments: dashboardData?.stats.totalAppointments ?? 0,

    totalSlots: dashboardData?.todaySlots.totalSlots ?? 0,
    remainingSlots: dashboardData?.todaySlots.openSlots ?? 0,
    bookedSlots: dashboardData?.todaySlots.bookedSlots ?? 0,
    postedSchedules: dashboardData?.todaySlots.postedSchedules ?? 0,

    pending: dashboardData?.appointments.pending ?? 0,
    accepted: dashboardData?.appointments.accepted ?? 0,
    rejected: dashboardData?.appointments.rejected ?? 0,
  };

  const genderData = [
    { label: "Male", value: dashboardData?.gender.male ?? 0 },
    { label: "Female", value: dashboardData?.gender.female ?? 0 },
    { label: "Other / Not Set", value: dashboardData?.gender.other ?? 0 },
  ];

  const appointmentData = [
    { label: "Pending", value: stats.pending },
    { label: "Accepted", value: stats.accepted },
    { label: "Rejected", value: stats.rejected },
  ];

  const slotData = [
    { label: "Booked Slots", value: stats.bookedSlots },
    { label: "Open Slots", value: stats.remainingSlots },
  ];

  const conditionData = [
    {
      label: "Hypertension",
      value: dashboardData?.conditions.hypertension ?? 0,
    },
    {
      label: "Diabetes",
      value: dashboardData?.conditions.diabetes ?? 0,
    },
    {
      label: "Heart Disease",
      value: dashboardData?.conditions.heartDisease ?? 0,
    },
    {
      label: "Tuberculosis",
      value: dashboardData?.conditions.tuberculosis ?? 0,
    },
    {
      label: "Allergies",
      value: dashboardData?.conditions.allergies ?? 0,
    },
    {
      label: "Cancer",
      value: dashboardData?.conditions.cancer ?? 0,
    },
  ];

  if (loading) {
    return (
      <InlineLoader label="Loading overview data..." />
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="grid grid-cols-4 items-stretch gap-2 sm:gap-4">
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="Total Residents"
          value={String(stats.totalResidents)}
        />

        <MetricCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Medical Records"
          value={String(stats.medicalRecords)}
        />

        <MetricCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Total Appointments"
          value={String(stats.totalAppointments)}
        />

        <MetricCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Open Slots"
          value={String(stats.remainingSlots)}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Panel
          icon={<Activity className="h-5 w-5" />}
          title="Resident Gender Overview"
          subtitle="Male, female, and other resident records"
        >
          <DonutChart data={genderData} />
        </Panel>

        <Panel
          icon={<BarChart3 className="h-5 w-5" />}
          title="Appointment Status"
          subtitle="Pending, accepted, and rejected appointment requests"
        >
          <BarList data={appointmentData} />
        </Panel>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Panel
          icon={<HeartPulse className="h-5 w-5" />}
          title="Common Medical Conditions"
          subtitle="Based on resident medical history records"
        >
          <BarList data={conditionData} />
        </Panel>

        <Panel
          icon={<Stethoscope className="h-5 w-5" />}
          title="Slot Usage Overview"
          subtitle="Booked and available doctor appointment slots"
        >
          <DonutChart data={slotData} />
        </Panel>
      </div>

      <Panel
        icon={<CalendarCheck className="h-5 w-5" />}
        title="Health Center Clinical Summary"
        subtitle="Connected doctor monitoring overview"
      >
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryBox
            title="Posted Schedules"
            value={String(stats.postedSchedules)}
          />
          <SummaryBox title="Total Slots" value={String(stats.totalSlots)} />
          <SummaryBox title="Open Slots" value={String(stats.remainingSlots)} />
          <SummaryBox title="Booked Slots" value={String(stats.bookedSlots)} />
        </div>
      </Panel>
    </div>
  );
}
function PersonalInfoTab({
  user,
  initials,
}: {
  user: DoctorUser;
  initials: string;
}) {
  return (
    <div className="space-y-5 pb-4">
      <ProfileInfoPanel
        fullName={user.fullName}
        initials={initials}
        roleLabel="Doctor"
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
      <span className="flex h-6 w-6 shrink-0 items-center justify-center">
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
        <p className="text-[8px] sm:text-sm text-slate-500 leading-tight line-clamp-2">{label}</p>
        <p className="mt-0.5 sm:mt-2 text-base sm:text-3xl font-extrabold text-slate-900 line-clamp-1">{value}</p>
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
    <div className="isolate [transform:translateZ(0)] rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm">
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


function FormInput({
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
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[52px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "ACCEPTED"
      ? "bg-emerald-100 text-emerald-700"
      : status === "REJECTED"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${style}`}
    >
      {status}
    </span>
  );
}

function getResidentName(appointment: DoctorAppointment) {
  const resident = appointment.resident;

  if (!resident) return "Resident";

  return `${resident.firstName || ""} ${resident.middleName || ""} ${
    resident.lastName || ""
  }`
    .replace(/\s+/g, " ")
    .trim();
}
function SuggestionModal({
  appointment,
  onClose,
  onSave,
}: {
  appointment: DoctorAppointment;
  onClose: () => void;
  onSave: (appointmentId: string, suggestion: string) => Promise<boolean>;
}) {
  const [suggestion, setSuggestion] = useState(appointment.suggestion || "");
  const [saving, setSaving] = useState(false);

  const residentName = getResidentName(appointment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    const ok = await onSave(appointment.id, suggestion.trim());
    setSaving(false);

    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed left-0 top-0 z-[99999] flex h-screen w-screen items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[30px] bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-[#0EA5E9] to-sky-500 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-100">
                Doctor Suggestion
              </p>
              <h2 className="mt-1 text-2xl font-black">{residentName}</h2>
              <p className="mt-1 text-sm text-sky-100">
                {formatTime(appointment.time)} • Queue #{appointment.queueNumber || "-"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white/20 px-3 py-2 text-sm font-black text-white ring-1 ring-white/25 hover:bg-white/30"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-sky-600">
              Appointment Reason
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {appointment.reason === "Others"
                ? appointment.otherReason || "Others"
                : appointment.reason}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              Suggestion / Medicine / Advice
            </label>

            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Example: Take paracetamol after meals if fever occurs. Avoid oily foods. Drink plenty of water. Return after 3 days if symptoms continue."
              className="min-h-[180px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold leading-7 text-slate-900 outline-none transition focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#0EA5E9] px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-500/25 hover:bg-sky-600 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {saving ? "Saving..." : "Save Suggestion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResidentDetailsModal({
  appointment,
  onClose,
}: {
  appointment: DoctorAppointment;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<
    "identifying" | "medical" | "family" | "social"
  >("identifying");

  const resident = appointment.resident;

  if (!resident) return null;

  return (
    <div className="fixed left-0 top-0 z-[99999] flex h-screen w-screen items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[30px] bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-[#0EA5E9] to-sky-500 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-100">
                Resident Details
              </p>
              <h2 className="mt-1 text-2xl font-black">
                {resident.fullName || getResidentName(appointment)}
              </h2>
              <p className="mt-1 text-sm text-sky-100">
                Appointment at {formatTime(appointment.time)} • Queue #
                {appointment.queueNumber || "-"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white/20 px-3 py-2 text-sm font-black text-white ring-1 ring-white/25 hover:bg-white/30"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="border-b border-sky-200 bg-white px-5 pt-4">
          <div className="flex gap-2 overflow-x-auto">
            <ModalTabButton
              active={tab === "identifying"}
              label="Identifying Data"
              onClick={() => setTab("identifying")}
            />
            <ModalTabButton
              active={tab === "medical"}
              label="Medical History"
              onClick={() => setTab("medical")}
            />
            <ModalTabButton
              active={tab === "family"}
              label="Family History"
              onClick={() => setTab("family")}
            />
            <ModalTabButton
              active={tab === "social"}
              label="Personal / Social"
              onClick={() => setTab("social")}
            />
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="mb-5 rounded-[24px] border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-sky-500">
              Appointment Reason
            </p>
            <p className="mt-1 text-base font-bold text-slate-900">
              {appointment.reason === "Others"
                ? appointment.otherReason
                : appointment.reason}
            </p>
          </div>

          {tab === "identifying" && (
            <DetailSection title="Identifying Data">
              <DetailInfo label="Full Name" value={resident.fullName} />
              <DetailInfo label="Age" value={resident.age} />
              <DetailInfo label="Sex" value={resident.sex} />
              <DetailInfo
                label="Birth Date"
                value={
                  resident.birthDate
                    ? new Date(resident.birthDate).toLocaleDateString()
                    : null
                }
              />
              <DetailInfo label="Civil Status" value={resident.civilStatus} />
              <DetailInfo label="Religion" value={resident.religion} />
              <DetailInfo
                label="Educational Attainment"
                value={resident.educationalAttainment}
              />
              <DetailInfo label="Occupation" value={resident.occupation} />
              <DetailInfo label="Contact Number" value={resident.contactNumber} />
              <DetailInfo label="Email" value={resident.email} />
              <DetailInfo label="Phone Number" value={resident.phoneNumber} />
              <DetailInfo label="Username" value={resident.username} />
              <DetailInfo
                label="Verified Resident"
                value={resident.isVerified ? "Yes" : "No"}
              />
              <DetailInfo label="House / Street" value={resident.houseStreet} />
              <DetailInfo label="Complete Address" value={resident.completeAddress} />
              <DetailInfo label="Barangay" value={resident.barangayName} />
              <DetailInfo label="City" value={resident.city} />
              <DetailInfo label="Accompanying Person" value={resident.accompanyingPerson} />
              <DetailInfo label="Relationship" value={resident.relationship} />
              <DetailInfo label="Spouse Maiden Name" value={resident.spouseMaidenName} />
              <DetailInfo label="Spouse Occupation" value={resident.spouseOccupation} />
              <DetailInfo label="Spouse Contact Number" value={resident.spouseContactNumber} />
            </DetailSection>
          )}

          {tab === "medical" && (
            <DetailSection title="Past Medical History">
              <DetailInfo label="Hypertension" value={yesNo(resident.medicalHistory?.hasHypertension)} />
              <DetailInfo label="Diabetes" value={yesNo(resident.medicalHistory?.hasDiabetes)} />
              <DetailInfo label="STI / HIV" value={yesNo(resident.medicalHistory?.hasStiHiv)} />
              <DetailInfo label="Heart Disease" value={yesNo(resident.medicalHistory?.hasHeartDisease)} />
              <DetailInfo label="Kidney Failure" value={yesNo(resident.medicalHistory?.hasKidneyFailure)} />
              <DetailInfo label="Tuberculosis" value={yesNo(resident.medicalHistory?.hasTuberculosis)} />
              <DetailInfo label="Allergies" value={yesNo(resident.medicalHistory?.hasAllergies)} />
              <DetailInfo label="Allergies Details" value={resident.medicalHistory?.allergiesDetails} />
              <DetailInfo label="Cancer" value={yesNo(resident.medicalHistory?.hasCancer)} />
              <DetailInfo label="Cancer Details" value={resident.medicalHistory?.cancerDetails} />
              <DetailInfo label="Other Conditions" value={yesNo(resident.medicalHistory?.hasOtherConditions)} />
              <DetailInfo label="Other Conditions Details" value={resident.medicalHistory?.otherConditionsDetails} />
              <DetailInfo label="Maintenance Medications" value={resident.medicalHistory?.maintenanceMedications} />
              <DetailInfo label="Previous Illnesses / Surgeries" value={resident.medicalHistory?.previousIllnessesSurgeries} />
            </DetailSection>
          )}

          {tab === "family" && (
            <DetailSection title="Family History">
              <DetailInfo label="Asthma / Allergies" value={yesNo(resident.familyHistory?.asthmaAllergies)} />
              <DetailInfo label="Birth Defects" value={yesNo(resident.familyHistory?.birthDefects)} />
              <DetailInfo label="Cancer" value={yesNo(resident.familyHistory?.cancer)} />
              <DetailInfo label="Dementia" value={yesNo(resident.familyHistory?.dementia)} />
              <DetailInfo label="Diabetes" value={yesNo(resident.familyHistory?.diabetes)} />
              <DetailInfo label="Hypertension" value={yesNo(resident.familyHistory?.hypertension)} />
              <DetailInfo label="Kidney Disease" value={yesNo(resident.familyHistory?.kidneyDisease)} />
              <DetailInfo label="Mental Illness" value={yesNo(resident.familyHistory?.mentalIllness)} />
            </DetailSection>
          )}

          {tab === "social" && (
            <DetailSection title="Personal / Social History">
              <DetailInfo label="Eats Healthy Diet" value={yesNo(resident.personalSocialHistory?.eatsHealthyDiet)} />
              <DetailInfo label="Adequate Physical Activity" value={yesNo(resident.personalSocialHistory?.adequatePhysicalActivity)} />
              <DetailInfo label="Sufficient Rest / Sleep" value={yesNo(resident.personalSocialHistory?.sufficientRestSleep)} />
              <DetailInfo label="Normal Growth / Development" value={yesNo(resident.personalSocialHistory?.normalGrowthDevelopment)} />
              <DetailInfo label="Multiple Sex Partners" value={yesNo(resident.personalSocialHistory?.multipleSexPartners)} />
              <DetailInfo label="Smokes Tobacco" value={yesNo(resident.personalSocialHistory?.smokesTobacco)} />
              <DetailInfo label="Tobacco Packs Per Year" value={resident.personalSocialHistory?.tobaccoPacksPerYear} />
              <DetailInfo label="Drinks Alcohol" value={yesNo(resident.personalSocialHistory?.drinksAlcohol)} />
              <DetailInfo label="Alcohol Bottles Per Day" value={resident.personalSocialHistory?.alcoholBottlesPerDay} />
              <DetailInfo label="Takes Illicit Drugs" value={yesNo(resident.personalSocialHistory?.takesIllicitDrugs)} />
              <DetailInfo label="Illicit Drugs Details" value={resident.personalSocialHistory?.illicitDrugsDetails} />
            </DetailSection>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalTabButton({
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

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-sky-900">{title}</h3>
      <div className="mt-2 h-1 w-16 rounded-full bg-[#0EA5E9]" />
      <div className="mt-4 grid gap-3">{children}</div>
    </div>
  );
}

function DetailInfo({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold text-slate-950">
        {String(value)}
      </p>
    </div>
  );
}

function yesNo(value: boolean | null | undefined) {
  return value ? "Yes" : "No";
}

function getResidentInitials(appointment: DoctorAppointment) {
  const name = getResidentName(appointment);

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatLongDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(value: string) {
  if (!value) return "";

  const [hourRaw, minuteRaw] = value.split(":");

  const date = new Date();
  date.setHours(Number(hourRaw), Number(minuteRaw || 0), 0, 0);

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
