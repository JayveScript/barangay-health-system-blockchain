"use client";


import React, { useEffect, useMemo, useState, useRef } from "react";
import { useSecureQrUrl } from "@/hooks/useSecureQrUrl";
import { createPortal } from "react-dom";
import * as htmlToImage from "html-to-image";
import {
  Bell,
MessageSquareText,
Menu,
X,
  CalendarCheck,
  CalendarClock,
  Clock,
  LogOut,
  MapPin,
  Stethoscope,
  Megaphone,
  IdCard,
  UserRound,
  ScanLine,
} from "lucide-react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PortalLoader } from "@/components/PortalLoader";
import {
  buildConditionUpdates,
  formatUpdateDate,
  type ConditionUpdate,
} from "@/lib/condition-updates";

type ResidentData = {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  age: number;
  sex: string;
  birthDate: string;
  religion?: string | null;
  completeAddress: string;
  barangayName: string;
  city?: string | null;
  civilStatus: string;
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
  username: string;
  isVerified: boolean;

  medicalHistory?: {
    hasHypertension: boolean;
    hasDiabetes: boolean;
    hasStiHiv: boolean;
    hasHeartDisease: boolean;
    hasKidneyFailure: boolean;
    hasTuberculosis: boolean;
    hasAllergies: boolean;
    allergiesDetails?: string | null;
    hasCancer: boolean;
    cancerDetails?: string | null;
    hasOtherConditions: boolean;
    otherConditionsDetails?: string | null;
    maintenanceMedications?: string | null;
    previousIllnessesSurgeries?: string | null;
  } | null;

  familyHistory?: {
    asthmaAllergies: boolean;
    birthDefects: boolean;
    cancer: boolean;
    dementia: boolean;
    diabetes: boolean;
    hypertension: boolean;
    kidneyDisease: boolean;
    mentalIllness: boolean;
  } | null;

  personalSocialHistory?: {
    eatsHealthyDiet: boolean;
    adequatePhysicalActivity: boolean;
    sufficientRestSleep: boolean;
    normalGrowthDevelopment: boolean;
    multipleSexPartners: boolean;
    smokesTobacco: boolean;
    tobaccoPacksPerYear?: string | null;
    drinksAlcohol: boolean;
    alcoholBottlesPerDay?: string | null;
    takesIllicitDrugs: boolean;
    illicitDrugsDetails?: string | null;
  } | null;
};

type ResidentAppointment = {
  id: string;
  date: string;
  time: string;
  reason: string;
  otherReason?: string | null;
  suggestion?: string | null;
  status: string;
  queueNumber?: number;
  doctor?: {
    fullName?: string | null;
  } | null;
};

type AvailableDoctor = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  slots: {
    time: string;
    queueNumber: number;
  }[];
  doctor: {
    id: string;
    fullName: string;
    username: string;
    barangay?: {
      name: string;
    } | null;
  };
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  publishDate: string;
  createdAt: string;
};

function ResidentAnnouncementsTab() {
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

      setAnnouncements(json);
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
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[26px] border border-sky-200 bg-[#EFF6FF] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900">
            Announcements for {formatLongDate(selectedDate)}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Default view shows today. Use the calendar to view other dates.
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
            className="min-h-[46px] w-full sm:w-auto rounded-xl border border-sky-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-[26px] border border-sky-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Loading announcements...
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 to-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-white text-sky-600 shadow-sm ring-1 ring-sky-200">
            <Megaphone className="h-10 w-10 stroke-[2.8]" />
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
              className="overflow-hidden rounded-[30px] border border-sky-200 bg-white shadow-lg shadow-sky-900/5"
            >
              {item.imageUrl ? (
                <div className="bg-slate-100">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="max-h-[380px] w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-44 items-center justify-center bg-gradient-to-br from-sky-50 to-white text-sky-600">
                  <Megaphone className="h-14 w-14 stroke-[2.8]" />
                </div>
              )}

              <div className="p-5">
                <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-600">
                  {formatLongDate(item.publishDate)}
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
    </div>
  );
}

type ResidentNotification = {
  id: string;
  type:
    | "diagnosis"
    | "record-update"
    | "suggestion"
    | "availability"
    | "announcement"
    | "scan";
  title: string;
  message: string;
  doctorName: string | null;
  barangayName: string | null;
  conditions?: string[];
  actorName?: string | null;
  actorRole?: string | null;
  createdAt: string;
};

const NOTIFICATION_STYLES: Record<
  ResidentNotification["type"],
  { label: string; icon: React.ReactNode; ring: string; chip: string; iconWrap: string }
> = {
  diagnosis: {
    label: "Diagnosis",
    icon: <Stethoscope className="h-5 w-5 stroke-[2.6]" />,
    ring: "border-rose-200",
    chip: "bg-rose-50 text-rose-600",
    iconWrap: "bg-rose-50 text-rose-600 ring-rose-200",
  },
  "record-update": {
    label: "Record Update",
    icon: <MessageSquareText className="h-5 w-5" />,
    ring: "border-violet-200",
    chip: "bg-violet-50 text-violet-600",
    iconWrap: "bg-violet-50 text-violet-600 ring-violet-200",
  },
  suggestion: {
    label: "Suggestion",
    icon: <CalendarClock className="h-5 w-5" />,
    ring: "border-amber-200",
    chip: "bg-amber-50 text-amber-600",
    iconWrap: "bg-amber-50 text-amber-600 ring-amber-200",
  },
  availability: {
    label: "Doctor Availability",
    icon: <CalendarCheck className="h-5 w-5" />,
    ring: "border-emerald-200",
    chip: "bg-emerald-50 text-emerald-600",
    iconWrap: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  },
  announcement: {
    label: "Announcement",
    icon: <Megaphone className="h-5 w-5 stroke-[2.6]" />,
    ring: "border-sky-200",
    chip: "bg-sky-50 text-sky-600",
    iconWrap: "bg-sky-50 text-sky-600 ring-sky-200",
  },
  scan: {
    label: "QR Scan",
    icon: <ScanLine className="h-5 w-5" />,
    ring: "border-indigo-200",
    chip: "bg-indigo-50 text-indigo-600",
    iconWrap: "bg-indigo-50 text-indigo-600 ring-indigo-200",
  },
};

const NOTIFICATION_FILTERS: { id: "all" | ResidentNotification["type"]; label: string }[] = [
  { id: "all", label: "All" },
  { id: "scan", label: "QR Scans" },
  { id: "diagnosis", label: "Diagnoses" },
  { id: "record-update", label: "Record Updates" },
  { id: "suggestion", label: "Suggestions" },
  { id: "availability", label: "Availability" },
  { id: "announcement", label: "Announcements" },
];

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;

  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ResidentNotificationsTab() {
  const [notifications, setNotifications] = useState<ResidentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | ResidentNotification["type"]>("all");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/residents/me/notifications");
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || "Failed to load notifications.");
          return;
        }

        setNotifications(json.notifications || []);
      } catch (err) {
        console.error(err);
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of notifications) {
      map[item.type] = (map[item.type] || 0) + 1;
    }
    return map;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter((item) => item.type === filter);
  }, [notifications, filter]);

  return (
    <div className="space-y-5">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {NOTIFICATION_FILTERS.map((tab) => {
          const count =
            tab.id === "all" ? notifications.length : counts[tab.id] || 0;
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                active
                  ? "bg-[#0EA5E9] text-white shadow-sm shadow-sky-500/25"
                  : "border border-sky-200 bg-white text-slate-600 hover:bg-sky-50"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-black ${
                  active ? "bg-white/25 text-white" : "bg-sky-50 text-sky-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-[26px] border border-sky-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Loading notifications...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 to-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-white text-sky-600 shadow-sm ring-1 ring-sky-200">
            <Bell className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            No notifications
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            You have no notifications in this category yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => {
            const style = NOTIFICATION_STYLES[item.type];
            return (
              <div
                key={item.id}
                className={`rounded-[24px] border ${style.ring} bg-white p-4 shadow-sm sm:p-5`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ${style.iconWrap}`}
                  >
                    {style.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${style.chip}`}
                      >
                        {style.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <h4 className="mt-2 text-base font-black text-slate-900">
                      {item.title}
                    </h4>

                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {item.message}
                    </p>

                    {(item.doctorName ||
                      item.barangayName ||
                      item.actorName ||
                      item.actorRole) && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {item.actorRole && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
                            <ScanLine className="h-3.5 w-3.5" />
                            {item.actorRole}
                          </span>
                        )}
                        {item.actorName && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                            <UserRound className="h-3.5 w-3.5 text-indigo-600" />
                            {item.actorName}
                          </span>
                        )}
                        {item.doctorName && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                            <Stethoscope className="h-3.5 w-3.5 text-sky-600" />
                            Dr. {item.doctorName}
                          </span>
                        )}
                        {item.barangayName && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600">
                            <MapPin className="h-3.5 w-3.5" />
                            {item.barangayName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const appointmentReasons = [
  "General Check-up",
  "Follow-up Check-up",
  "Medical Consultation",
  "Prescription Request",
  "Laboratory Result Review",
  "Prenatal Consultation",
  "Child Consultation",
  "Others",
];

export default function ResidentDashboard() {
  const [resident, setResident] = useState<ResidentData | null>(null);
  const [residentError, setResidentError] = useState("");
  const [activeTab, setActiveTab] = useState("identifying");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<ResidentData | null>(null);
  const [sidebarTab, setSidebarTab] = useState<
  "personal" | "medical-history" | "appointments" | "notifications" | "announcements" | "digital"
>("personal");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/residents/me")
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load resident profile.");
        }

        setResident(data);
        setEditForm(data);
      })
      .catch((error) => {
        console.error("RESIDENT_PROFILE_LOAD_ERROR", error);
        setResidentError(
          error instanceof Error
            ? error.message
            : "Failed to load resident profile."
        );
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
      });

      window.location.href = "/login";
    } catch (error) {
      console.error("LOGOUT_ERROR", error);
    }
  };

  const updateEditForm = (key: keyof ResidentData, value: string | number) => {
  setEditForm((prev) => {
    if (!prev) return prev;

    return {
      ...prev,
      [key]: value,
    };
  });
};

  if (!resident) {
    return (
      <PortalLoader
        label="Loading resident portal..."
        error={residentError || undefined}
        onRetry={residentError ? handleLogout : undefined}
      />
    );
  }

  const fullName = `${resident.firstName} ${resident.middleName ?? ""} ${
    resident.lastName
  }`
    .replace(/\s+/g, " ")
    .trim();
  const currentBarangayName = resident.barangayName || "Assigned Barangay";

  const residentBottomNavItems = [
    { id: "personal",       label: "Profile",      icon: <UserRound className="h-5 w-5" /> },
    { id: "medical-history",label: "Medical",      icon: <Stethoscope className="h-5 w-5" /> },
    { id: "appointments",   label: "Appointments", icon: <CalendarCheck className="h-5 w-5" /> },
    { id: "notifications",  label: "Alerts",       icon: <Bell className="h-5 w-5" /> },
    { id: "announcements",  label: "News",         icon: <Megaphone className="h-5 w-5" /> },
    { id: "digital",        label: "Digital ID",   icon: <IdCard className="h-5 w-5" /> },
  ];

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#EFF6FF] px-4 pb-[72px] py-4 md:px-8 md:py-6 lg:px-10 lg:pb-6">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="mx-auto h-full max-w-7xl">
        <div className="grid h-full gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Mobile sidebar */}
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[280px] transform rounded-r-[30px] border border-[#DCEAF7] bg-white/95 p-4 text-slate-800 shadow-2xl shadow-sky-900/10 transition-transform duration-300 lg:hidden ${
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25">
                  <ShieldIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="whitespace-nowrap text-lg font-bold">
                    Health Portal
                  </h2>
                  <p className="text-xs text-slate-500">Navigation</p>
                </div>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-slate-500 ring-1 ring-sky-200 hover:bg-sky-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setSidebarTab("personal");
                  setMobileSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
                  sidebarTab === "personal"
                    ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
                    : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                }`}
              >
                <UserIcon className="h-5 w-5 shrink-0" />
                Personal Info
              </button>

              <button
                type="button"
                onClick={() => {
                  setSidebarTab("medical-history");
                  setMobileSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
                  sidebarTab === "medical-history"
                    ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
                    : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                }`}
              >
                <Stethoscope className="h-5 w-5 shrink-0 stroke-[2.8]" />
                Medical History
              </button>

              <button
                type="button"
                onClick={() => {
                  setSidebarTab("appointments");
                  setMobileSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
                  sidebarTab === "appointments"
                    ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
                    : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                }`}
              >
                <CalendarCheck className="h-5 w-5 shrink-0" />
                Appointments
              </button>

              <button
                type="button"
                onClick={() => {
                  setSidebarTab("notifications");
                  setMobileSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
                  sidebarTab === "notifications"
                    ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
                    : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                }`}
              >
                <Bell className="h-5 w-5 shrink-0" />
                Notifications
              </button>

              <button
                type="button"
                onClick={() => {
                  setSidebarTab("announcements");
                  setMobileSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
                  sidebarTab === "announcements"
                    ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
                    : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                }`}
              >
                <Megaphone className="h-5 w-5 shrink-0 stroke-[2.8]" />
                Announcements
              </button>

              <button
                type="button"
                onClick={() => {
                  setSidebarTab("digital");
                  setMobileSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
                  sidebarTab === "digital"
                    ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
                    : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                }`}
              >
                <IdCardIcon className="h-5 w-5 shrink-0" />
                Digital ID
              </button>
            </div>
          </aside>

          {/* Desktop sidebar */}
          <aside className="hidden rounded-[30px] border border-[#DCEAF7] bg-white p-5 text-slate-800 shadow-2xl shadow-sky-900/10 lg:block">
            <div className="rounded-[24px] border border-sky-200 bg-sky-50/60 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25">
                  <ShieldIcon className="h-6 w-6 text-white" />
                </div>

                <div>
                  <h2 className="whitespace-nowrap text-lg font-bold">
                    Health Portal
                  </h2>
                  <p className="text-sm text-slate-500">Navigation</p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={() => setSidebarTab("personal")}
                  className={`flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
                    sidebarTab === "personal"
                    ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
                    : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                  }`}
                >
                  <UserIcon className="h-5 w-5 shrink-0" />
                  Personal Info
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarTab("medical-history")}
                  className={`flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
                    sidebarTab === "medical-history"
                      ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
                      : "text-slate-600 hover:bg-white hover:text-sky-600"
                  }`}
                >
                  <Stethoscope className="h-5 w-5 shrink-0 stroke-[2.8]" />
                  Medical History
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarTab("appointments")}
                  className={`flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
                    sidebarTab === "appointments"
                      ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
                      : "text-slate-600 hover:bg-white hover:text-sky-600"
                  }`}
                >
                  <CalendarCheck className="h-5 w-5 shrink-0" />
                  Appointments
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarTab("notifications")}
                  className={`flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
                    sidebarTab === "notifications"
                      ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
                      : "text-slate-600 hover:bg-white hover:text-sky-600"
                  }`}
                >
                  <Bell className="h-5 w-5 shrink-0" />
                  Notifications
                </button>

                <button
  type="button"
  onClick={() => setSidebarTab("announcements")}
  className={`flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
    sidebarTab === "announcements"
      ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
      : "text-slate-600 hover:bg-white hover:text-sky-600"
  }`}
>
  <Megaphone className="h-5 w-5 shrink-0 stroke-[2.8]" />
  Announcements
</button>

                <button
                  type="button"
                  onClick={() => setSidebarTab("digital")}
                  className={`flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
                    sidebarTab === "digital"
                      ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
                      : "text-slate-600 hover:bg-white hover:text-sky-600"
                  }`}
                >
                  <IdCardIcon className="h-5 w-5 shrink-0" />
                  Digital ID
                </button>
              </div>
            </div>
          </aside>

          <section className="h-full overflow-y-auto [transform:translateZ(0)] [will-change:transform] [backface-visibility:hidden] rounded-[30px] border border-[#DCEAF7] bg-white p-4 shadow-2xl shadow-sky-900/10 backdrop-blur md:p-6">
            <div className="mb-6 flex flex-col gap-4 overflow-hidden rounded-[24px] border border-sky-200 bg-gradient-to-br from-white to-sky-50 p-5 shadow-lg shadow-sky-900/5 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                {/* Mobile hamburger menu button */}
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden flex h-11 w-11 items-center justify-center rounded-xl bg-[#0EA5E9] text-white shadow-md shadow-sky-500/25 hover:bg-sky-600"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    fullName
                  )}&background=DBEAFE&color=1D4ED8&bold=true&size=128`}
                  alt={fullName}
                  className="hidden h-16 w-16 rounded-2xl border border-white object-cover shadow-md ring-4 ring-sky-100/80 sm:block"
                />

                <div className="min-w-0 flex-1 basis-0">
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <h2 className="max-w-full whitespace-nowrap text-base font-bold tracking-tight text-slate-900 min-[380px]:text-lg sm:text-2xl">
                      {fullName}
                    </h2>

                    {resident.isVerified && (
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#0EA5E9] px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                        <VerifiedIcon className="h-3.5 w-3.5" />
                        Verified Resident
                      </span>
                    )}

                    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-600">
                      <MapPin className="h-3.5 w-3.5" />
                      {currentBarangayName}
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-snug text-slate-500 sm:text-sm">
                    Secure access to personal and medical records
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-red-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 md:self-center"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>

            

            {sidebarTab === "personal" && (
              <>
                <div className="mb-6">
                  <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        aria-label={tab.label}
                        title={tab.label}
                        className={`flex h-12 items-center justify-center gap-2 rounded-xl px-2 text-sm font-bold transition sm:h-auto sm:px-4 sm:py-3 ${
                          activeTab === tab.id ? tab.activeClass : tab.idleClass
                        }`}
                      >
                        <span className="sm:hidden">{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-sky-200 bg-gradient-to-br from-white to-sky-50/40 p-4 shadow-sm md:p-6">
                  {activeTab === "identifying" && (
                    <Section
  title="Identifying Data"
  subtitle="Resident profile grouped into one clean section with personal information, contact details, and address."
  icon={<UserIcon className="h-5 w-5" />}
  right={
    <div className="flex flex-wrap items-center gap-2">
      {editMode ? (
        <>
          <button
            type="button"
            onClick={() => {
              setEditMode(false);
              setEditForm(resident);
            }}
            className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              console.log("SAVE RESIDENT:", editForm);
              setEditMode(false);
            }}
            className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-600 shadow-sm transition hover:bg-sky-100"
          >
            Save
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setEditMode(true)}
          className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-sky-600"
        >
          Edit
        </button>
      )}
    </div>
  }
>
                      <ResidentIdentityCard
                        resident={editForm || resident}
                        fullName={fullName}
                        editMode={editMode}
                        onChange={updateEditForm}
                      />
                    </Section>
                  )}

                  {activeTab === "family" && (
                    <Section
                      title="Family History"
                      subtitle="Recorded hereditary or family-related health conditions."
                      icon={<FamilyIcon className="h-5 w-5" />}
                    >
                      <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
                        <HealthInfoGroup
                          title="Hereditary Conditions"
                          icon={<FamilyIcon className="h-4 w-4" />}
                          tone="bad"
                          columns={2}
                          items={[
                            { label: "Asthma / Allergies", value: resident.familyHistory?.asthmaAllergies },
                            { label: "Birth Defects", value: resident.familyHistory?.birthDefects },
                            { label: "Cancer", value: resident.familyHistory?.cancer },
                            { label: "Dementia", value: resident.familyHistory?.dementia },
                            { label: "Diabetes", value: resident.familyHistory?.diabetes },
                            { label: "Hypertension", value: resident.familyHistory?.hypertension },
                            { label: "Kidney Disease", value: resident.familyHistory?.kidneyDisease },
                            { label: "Mental Illness", value: resident.familyHistory?.mentalIllness },
                          ]}
                        />
                      </div>
                    </Section>
                  )}

                  {activeTab === "personal" && (
                    <Section
                      title="Personal / Social History"
                      subtitle="Lifestyle, daily habits, and social health information."
                      icon={<LifestyleIcon className="h-5 w-5" />}
                    >
                      <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
                        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
                          <HealthInfoGroup
                            title="Healthy Lifestyle"
                            icon={<LifestyleIcon className="h-4 w-4" />}
                            tone="good"
                            items={[
                              { label: "Eats Healthy Diet", value: resident.personalSocialHistory?.eatsHealthyDiet },
                              { label: "Adequate Physical Activity", value: resident.personalSocialHistory?.adequatePhysicalActivity },
                              { label: "Sufficient Rest / Sleep", value: resident.personalSocialHistory?.sufficientRestSleep },
                              { label: "Normal Growth & Development", value: resident.personalSocialHistory?.normalGrowthDevelopment },
                              { label: "Multiple Sex Partners", value: resident.personalSocialHistory?.multipleSexPartners, tone: "bad" },
                            ]}
                          />

                          <HealthInfoGroup
                            title="Risk Factors"
                            icon={<ShieldIcon className="h-4 w-4" />}
                            tone="bad"
                            items={[
                              { label: "Smokes Tobacco", value: resident.personalSocialHistory?.smokesTobacco },
                              { label: "Packs / Year", value: resident.personalSocialHistory?.tobaccoPacksPerYear },
                              { label: "Drinks Alcohol", value: resident.personalSocialHistory?.drinksAlcohol },
                              { label: "Bottles / Day", value: resident.personalSocialHistory?.alcoholBottlesPerDay },
                              { label: "Takes Illicit Drugs", value: resident.personalSocialHistory?.takesIllicitDrugs },
                              { label: "Drug Details", value: resident.personalSocialHistory?.illicitDrugsDetails },
                            ]}
                          />
                        </div>
                      </div>
                    </Section>
                  )}
                </div>
              </>
            )}

            {sidebarTab === "medical-history" && (
              <div className="rounded-[24px] border border-sky-200 bg-gradient-to-br from-white to-sky-50/40 p-4 shadow-sm md:p-6">
                <ResidentMedicalHistoryTab resident={resident} />
              </div>
            )}

            {sidebarTab === "appointments" && (
  <div className="rounded-[24px] border border-sky-200 bg-gradient-to-br from-white to-sky-50/40 p-4 shadow-sm md:p-6">
    <ResidentAppointmentsTab />
  </div>
)}

            {sidebarTab === "notifications" && (
  <div className="rounded-[24px] border border-sky-200 bg-gradient-to-br from-white to-sky-50/40 p-4 shadow-sm md:p-6">
    <Section
      title="Notifications"
      subtitle="Diagnoses, medical record updates, checkup suggestions, doctor availability, and announcements — with the doctor's name and assigned barangay."
      icon={<Bell className="h-5 w-5" />}
    >
      <ResidentNotificationsTab />
    </Section>
  </div>
)}




            {sidebarTab === "digital" && (
              <div className="rounded-[24px] border border-sky-200 bg-gradient-to-br from-white to-sky-50/40 p-4 shadow-sm md:p-6">
                <Section
                  title="Digital ID Card"
                  subtitle="This is the resident's official barangay health digital identification card."
                  icon={<IdCardIcon className="h-5 w-5" />}
                >
                  <DigitalIdCard resident={resident} />
                </Section>
              </div>
            )}

            {sidebarTab === "announcements" && (
  <div className="rounded-[24px] border border-sky-200 bg-gradient-to-br from-white to-sky-50/40 p-4 shadow-sm md:p-6">
    <Section
      title="Health Center Announcements"
      subtitle="View today's, past, and upcoming announcements from the barangay health center."
      icon={<Megaphone className="h-5 w-5 stroke-[2.8]" />}
    >
      <ResidentAnnouncementsTab />
    </Section>
  </div>
)}
          </section>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav
        items={residentBottomNavItems}
        active={sidebarTab}
        onChange={(id) => {
          setSidebarTab(id as typeof sidebarTab);
          setMobileSidebarOpen(false);
        }}
      />
    </main>
  );
}

function ResidentAppointmentsTab() {
  
  const [availableDoctors, setAvailableDoctors] = useState<AvailableDoctor[]>([]);
  const [myAppointments, setMyAppointments] = useState<ResidentAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [mobileDetailAppointment, setMobileDetailAppointment] = useState<ResidentAppointment | null>(null);

  const [form, setForm] = useState({
    availabilityId: "",
    time: "",
    reason: "General Check-up",
    otherReason: "",
  });

  const removeLunchSlots = (slots: AvailableDoctor["slots"]) => {
    return slots.filter((slot) => {
      const hour = Number(slot.time.split(":")[0]);
      return hour !== 12;
    });
  };

  const selectedAvailability = useMemo(() => {
    return availableDoctors.find((item) => item.id === form.availabilityId);
  }, [availableDoctors, form.availabilityId]);

  const selectedAvailableSlots = useMemo(() => {
    return selectedAvailability ? removeLunchSlots(selectedAvailability.slots) : [];
  }, [selectedAvailability]);

  

  const selectedQueueNumber = useMemo(() => {
    if (!form.time) return null;

    const selectedSlot = selectedAvailableSlots.find(
      (slot) => slot.time === form.time
    );

    return selectedSlot?.queueNumber || null;
  }, [selectedAvailableSlots, form.time]);

  

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/appointments/resident");
      const text = await res.text();

      let json: {
        error?: string;
        availableDoctors?: AvailableDoctor[];
        myAppointments?: ResidentAppointment[];
      } = {};

      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        setError("Appointments API returned invalid JSON.");
        return;
      }

      if (!res.ok) {
        setError(json.error || "Failed to load appointments.");
        return;
      }

      setAvailableDoctors(json.availableDoctors || []);
      setMyAppointments(json.myAppointments || []);
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

  const handleOpenModal = (availabilityId: string) => {
    const item = availableDoctors.find((doctor) => doctor.id === availabilityId);
    const availableSlots = item ? removeLunchSlots(item.slots) : [];

    setForm({
      availabilityId,
      time: availableSlots[0]?.time || "",
      reason: "General Check-up",
      otherReason: "",
    });

    setMessage("");
    setError("");
    setModalOpen(true);
  };

  const handleRequestAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    

    try {
      setFormLoading(true);

      const res = await fetch("/api/appointments/resident", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const text = await res.text();

      let json: { error?: string; message?: string } = {};

      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        setError("Appointments API returned invalid JSON.");
        return;
      }

      if (!res.ok) {
        setError(json.error || "Failed to request appointment.");
        return;
      }

      setMessage("Appointment request sent. Please wait for doctor approval.");
      setModalOpen(false);

      setForm({
        availabilityId: "",
        time: "",
        reason: "General Check-up",
        otherReason: "",
      });

      await fetchAppointments();
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setFormLoading(false);
    }
  };

  const suggestionAppointments = myAppointments.filter(
  (appointment) => appointment.suggestion && appointment.suggestion.trim() !== ""
);

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-start justify-between gap-4">
  <div className="flex items-start gap-3">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-200">
      <CalendarCheck className="h-5 w-5" />
    </div>

    <div>
      <h2 className="text-xl font-bold tracking-tight text-slate-900">
        Doctor Appointments
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Choose an available doctor, select an open time slot, and submit your appointment reason.
      </p>
    </div>
  </div>

  
</div>
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="rounded-[30px] border border-sky-200 bg-gradient-to-br from-white to-sky-50/40 p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Loading available doctors...
        </div>
      ) : availableDoctors.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 to-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-white text-sky-600 shadow-sm ring-1 ring-sky-200">
            <CalendarCheck className="h-9 w-9" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            No doctor available tomorrow
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Please check again later when doctors post their available schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {availableDoctors.map((item) => {
            const availableSlots = removeLunchSlots(item.slots);

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_18px_45px_rgba(37,99,235,0.08)]"
              >
                <div className="bg-gradient-to-br from-white to-sky-50/40 p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3 sm:items-center sm:gap-5 min-w-0">
                      <div className="flex h-14 w-14 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-full border-2 sm:border-4 border-white bg-sky-50 shadow-md ring-1 ring-sky-200">
                        <UserIcon className="h-7 w-7 sm:h-12 sm:w-12 text-sky-500/70" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-lg sm:text-2xl font-black text-slate-950">
                            Dr. {item.doctor.fullName}
                          </h3>

                          <span className="shrink-0 rounded-full border border-sky-200 bg-sky-50 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-black text-sky-600 shadow-sm">
                            Doctor
                          </span>
                        </div>

                        <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-bold text-slate-500">
                          {item.doctor.barangay?.name || "Barangay Health Center"}
                        </p>

                        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-500">
                          Available on{" "}
                          <span className="font-black text-slate-900">
                            {formatLongDate(item.date)}
                          </span>{" "}
                          from {formatTime(item.startTime)} to{" "}
                          {formatTime(item.endTime)}
                        </p>

                        <p className="mt-1 text-[10px] sm:text-xs font-semibold text-sky-600">
                          Lunch break: 12:00 PM - 1:00 PM
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenModal(item.id)}
                      disabled={availableSlots.length === 0}
                      className="inline-flex min-h-[46px] sm:min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#0EA5E9] px-5 sm:px-7 py-2.5 sm:py-3 text-sm font-black text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600 disabled:bg-slate-300 disabled:shadow-none"
                    >
                      <CalendarCheck className="h-4 w-4" />
                      Request Appointment
                    </button>
                  </div>

                  <div className="mt-7 rounded-[28px] border border-sky-100 bg-white/90 p-5 shadow-sm ring-1 ring-sky-100">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-black uppercase tracking-wide text-slate-500">
                        Available Slots
                      </p>

                      <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-black text-sky-600">
                        {availableSlots.length} slot(s)
                      </span>
                    </div>

                    {availableSlots.length === 0 ? (
                      <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500">
                        No available slot left.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {availableSlots.map((slot) => (
                          <button
  key={slot.time}
  type="button"
  onClick={() => {
    setForm({
      availabilityId: item.id,
      time: slot.time,
      reason: "General Check-up",
      otherReason: "",
    });
    setModalOpen(true);
  }}
  className={`rounded-xl border px-4 py-3 text-center transition
    ${
      form.time === slot.time
        ? "border-sky-500 bg-sky-50 shadow-sm"
        : "border-sky-100 bg-white hover:border-sky-300"
    }`}
>
  <p className="text-base font-bold text-slate-900">
    {formatTime(slot.time)}
  </p>

  <p className="text-xs font-semibold text-sky-600">
    Queue #{slot.queueNumber}
  </p>
</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-[30px] border border-sky-200 bg-gradient-to-br from-white to-sky-50/40 p-5 shadow-sm">
  <div className="flex items-start justify-between gap-4">
    <div>
      <h3 className="text-xl font-black text-slate-900">
        My Appointment Requests
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Track your pending and approved appointment requests.
      </p>
    </div>

    <button
      type="button"
      onClick={() => setSuggestionsOpen(true)}
      className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-200 transition hover:bg-sky-100"
    >
      <Bell className="h-5 w-5" />

      {suggestionAppointments.length > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
          {suggestionAppointments.length}
        </span>
      )}
    </button>
  </div>

        {myAppointments.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-sky-200 bg-sky-50 p-6 text-center text-sm font-semibold text-slate-500">
            No appointment requests yet.
          </div>
        ) : (
          <>
          {/* Mobile compact layout - only TIME & QUEUE, tap for details */}
          <div className="mt-5 space-y-2 md:hidden">
            <div className="grid grid-cols-3 px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              <span>Time</span>
              <span className="text-center">Queue</span>
              <span className="text-right">Details</span>
            </div>
            {myAppointments.map((appointment) => (
              <button
                key={appointment.id}
                type="button"
                onClick={() => setMobileDetailAppointment(appointment)}
                className="flex w-full items-center rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition active:bg-slate-50"
              >
                <div className="flex-1">
                  <p className="text-sm font-bold text-sky-600">{formatTime(appointment.time)}</p>
                </div>
                <div className="flex-1 text-center">
                  <span className="inline-block rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-black text-sky-600">
                    #{appointment.queueNumber || "-"}
                  </span>
                </div>
                <div className="flex-1 flex justify-end items-center gap-1 text-xs font-semibold text-slate-400">
                  View
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
              </button>
            ))}
          </div>

          {/* Mobile detail modal */}
          {mobileDetailAppointment && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 md:hidden" onClick={() => setMobileDetailAppointment(null)}>
              <div
                className="w-full max-w-lg rounded-t-[28px] bg-white p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
                <h4 className="text-lg font-black text-slate-900">Appointment Details</h4>
                <p className="mt-1 text-xs text-slate-500">Full information for your appointment request.</p>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-xs font-semibold uppercase text-slate-400">Date</span>
                    <span className="text-sm font-bold text-slate-900">{formatLongDate(mobileDetailAppointment.date)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-xs font-semibold uppercase text-slate-400">Time</span>
                    <span className="text-sm font-bold text-sky-600">{formatTime(mobileDetailAppointment.time)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-xs font-semibold uppercase text-slate-400">Doctor</span>
                    <span className="text-sm font-bold text-slate-900">Dr. {mobileDetailAppointment.doctor?.fullName || "Doctor"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-xs font-semibold uppercase text-slate-400">Queue #</span>
                    <span className="rounded-lg bg-sky-50 px-3 py-1 text-sm font-black text-sky-600">#{mobileDetailAppointment.queueNumber || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-xs font-semibold uppercase text-slate-400">Status</span>
                    <StatusBadge status={mobileDetailAppointment.status} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-xs font-semibold uppercase text-slate-400">Reason</span>
                    <span className="text-sm font-semibold text-slate-700 text-right max-w-[60%]">
                      {mobileDetailAppointment.reason === "Others"
                        ? mobileDetailAppointment.otherReason
                        : mobileDetailAppointment.reason}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileDetailAppointment(null)}
                  className="mt-5 w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Desktop table layout - full columns */}
          <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Time</th>
                  <th className="px-4 py-4">Doctor</th>
                  <th className="px-4 py-4">Reason</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Queue #</th>
                 
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myAppointments.map((appointment) => (
                  <tr key={appointment.id} className="bg-white">
                    <td className="px-4 py-4 font-semibold text-slate-700">
                      {formatLongDate(appointment.date)}
                    </td>
                    <td className="px-4 py-4 font-bold text-sky-600">
                      {formatTime(appointment.time)}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-900">
                      Dr. {appointment.doctor?.fullName || "Doctor"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {appointment.reason === "Others"
                        ? appointment.otherReason
                        : appointment.reason}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={appointment.status} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-xl bg-sky-50 px-3 py-2 text-sm font-black text-sky-600">
                        #{appointment.queueNumber || "-"}
                      </span>
                    </td>


                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {suggestionsOpen && (
  <ResidentSuggestionsModal
    appointments={suggestionAppointments}
    onClose={() => setSuggestionsOpen(false)}
  />
)}

   {modalOpen && selectedAvailability && (
  <RequestAppointmentModal
    selectedAvailability={selectedAvailability}
    selectedAvailableSlots={selectedAvailableSlots}
    selectedQueueNumber={selectedQueueNumber}
    form={form}
    formLoading={formLoading}
    setForm={setForm}
    onClose={() => setModalOpen(false)}
    onSubmit={handleRequestAppointment}
  />
)}   

      
    </div>
  );
}

type ResidentBMIRecord = {
  id: string;
  height: number;
  weight: number;
  bmi: number;
  bmiCategory: string;
  pulseRate: number;
  createdAt: string;
  recordedBy?: { fullName?: string | null };
};

function bmiCategoryStyle(cat: string) {
  if (cat === "Underweight") return "bg-blue-50 border-blue-200 text-blue-700";
  if (cat === "Normal") return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (cat === "Overweight") return "bg-amber-50 border-amber-200 text-amber-700";
  return "bg-red-50 border-red-200 text-red-700";
}

function ResidentMedicalHistoryTab({
  resident,
}: {
  resident: ResidentData;
}) {
  const [appointments, setAppointments] = useState<ResidentAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bmiRecords, setBmiRecords] = useState<ResidentBMIRecord[]>([]);
  const [bmiLoading, setBmiLoading] = useState(true);
  const [conditionUpdates, setConditionUpdates] = useState<
    Record<string, ConditionUpdate>
  >({});

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/appointments/resident");
        const text = await res.text();

        let json: {
          error?: string;
          myAppointments?: ResidentAppointment[];
        } = {};

        try {
          json = text ? JSON.parse(text) : {};
        } catch {
          setError("Medical history API returned invalid JSON.");
          return;
        }

        if (!res.ok) {
          setError(json.error || "Failed to load medical history.");
          return;
        }

        setAppointments(json.myAppointments || []);
      } catch (err) {
        console.error(err);
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    const fetchBMI = async () => {
      try {
        setBmiLoading(true);
        const res = await fetch("/api/residents/bmi");
        const json = await res.json();
        if (res.ok) setBmiRecords(Array.isArray(json) ? json : []);
      } catch {
        /* silent */
      } finally {
        setBmiLoading(false);
      }
    };
    fetchBMI();
  }, []);

  useEffect(() => {
    const fetchDiagnoses = async () => {
      try {
        const res = await fetch("/api/residents/me/diagnoses");
        const json = await res.json();
        if (res.ok && Array.isArray(json)) {
          setConditionUpdates(buildConditionUpdates(json));
        }
      } catch {
        /* silent */
      }
    };
    fetchDiagnoses();
  }, []);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort(
      (a, b) => getAppointmentSortValue(b) - getAppointmentSortValue(a)
    );
  }, [appointments]);

  const suggestionAppointments = useMemo(
    () =>
      sortedAppointments.filter(
        (appointment) =>
          appointment.suggestion && appointment.suggestion.trim() !== ""
      ),
    [sortedAppointments]
  );

  const medicalConditions = [
    { label: "Hypertension", field: "hasHypertension", value: resident.medicalHistory?.hasHypertension },
    { label: "Diabetes", field: "hasDiabetes", value: resident.medicalHistory?.hasDiabetes },
    { label: "STI / HIV", field: "hasStiHiv", value: resident.medicalHistory?.hasStiHiv },
    { label: "Heart Disease", field: "hasHeartDisease", value: resident.medicalHistory?.hasHeartDisease },
    {
      label: "Kidney Failure",
      field: "hasKidneyFailure",
      value: resident.medicalHistory?.hasKidneyFailure,
    },
    { label: "Tuberculosis", field: "hasTuberculosis", value: resident.medicalHistory?.hasTuberculosis },
    { label: "Allergies", field: "hasAllergies", value: resident.medicalHistory?.hasAllergies },
    { label: "Cancer", field: "hasCancer", value: resident.medicalHistory?.hasCancer },
    {
      label: "Other Conditions",
      field: "hasOtherConditions",
      value: resident.medicalHistory?.hasOtherConditions,
    },
  ];

  const activeConditionCount = medicalConditions.filter(
    (item) => item.value === true
  ).length;
  const latestRecord = sortedAppointments[0];

  return (
    <Section
      title="Medical History"
      subtitle="A complete view of recorded health history, visits, and doctor guidance."
      icon={<Stethoscope className="h-5 w-5 stroke-[2.8]" />}
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HistoryMetric
            label="Recorded Conditions"
            value={activeConditionCount}
            detail={`${medicalConditions.length} checks reviewed`}
            tone="blue"
          />
          <HistoryMetric
            label="Appointments"
            value={appointments.length}
            detail="Total resident visits"
            tone="emerald"
          />
          <HistoryMetric
            label="Doctor Suggestions"
            value={suggestionAppointments.length}
            detail="Advice linked to visits"
            tone="amber"
          />
          <HistoryMetric
            label="Latest Record"
            value={latestRecord ? formatLongDate(latestRecord.date) : "None"}
            detail={latestRecord ? formatTime(latestRecord.time) : "No visits yet"}
            tone="slate"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="space-y-5">
            <div className="rounded-[28px] border border-sky-200 bg-gradient-to-br from-white to-sky-50/40 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Past Medical History
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Registered conditions and clinical flags.
                  </p>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-600">
                  {activeConditionCount} active
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {medicalConditions.map((item) => {
                  const update = conditionUpdates[item.field];
                  return (
                    <HistoryFlag
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      updatedBy={update?.by}
                      updatedAt={update ? formatUpdateDate(update.at) : undefined}
                      selfReportedBy={`${resident.firstName} ${resident.lastName}`
                        .replace(/\s+/g, " ")
                        .trim()}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-sky-200 bg-gradient-to-br from-white to-sky-50/40 p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Doctor Suggestions
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Advice and next steps from appointment records.
                  </p>
                </div>
                <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-600">
                  {suggestionAppointments.length} suggestion(s)
                </span>
              </div>

              {loading ? (
                <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-5 text-sm font-semibold text-sky-600">
                  Loading doctor suggestions...
                </div>
              ) : suggestionAppointments.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
                  No doctor suggestions recorded yet.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {suggestionAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            Dr. {appointment.doctor?.fullName || "Doctor"}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {formatLongDate(appointment.date)} at{" "}
                            {formatTime(appointment.time)}
                          </p>
                        </div>
                        <StatusBadge status={appointment.status} />
                      </div>
                      <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-7 text-slate-800">
                        {appointment.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-sky-200 bg-gradient-to-br from-white to-sky-50/40 p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Appointment Timeline
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    All recorded appointment requests and consultations.
                  </p>
                </div>
                <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-600">
                  {appointments.length} record(s)
                </span>
              </div>

              {loading ? (
                <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-5 text-sm font-semibold text-sky-600">
                  Loading appointment timeline...
                </div>
              ) : sortedAppointments.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
                  No appointments recorded yet.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {sortedAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="relative rounded-[24px] border border-white bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] p-4 shadow-sm ring-1 ring-slate-100"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-black text-sky-600">
                            {formatLongDate(appointment.date)}
                          </p>
                          <h4 className="mt-1 text-lg font-black text-slate-950">
                            Dr. {appointment.doctor?.fullName || "Doctor"}
                          </h4>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {formatTime(appointment.time)} | Queue #
                            {appointment.queueNumber || "-"}
                          </p>
                        </div>
                        <StatusBadge status={appointment.status} />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                            Appointment Reason
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-800">
                            {getAppointmentReason(appointment)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-sky-50 px-4 py-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-500">
                            Doctor Suggestion
                          </p>
                          <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-slate-800">
                            {appointment.suggestion || "No suggestion recorded."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BMI History */}
        <div className="rounded-[28px] border border-sky-200 bg-gradient-to-br from-white to-sky-50/40 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900">BMI &amp; Vitals History</h3>
              <p className="mt-1 text-sm text-slate-500">Recorded by health center staff.</p>
            </div>
            <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-600">
              {bmiRecords.length} record{bmiRecords.length !== 1 ? "s" : ""}
            </span>
          </div>

          {bmiLoading ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-5 text-sm font-semibold text-sky-600">
              Loading BMI records...
            </div>
          ) : bmiRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm font-semibold text-slate-500">
              No BMI records recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-sky-100 bg-sky-50/60">
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Date</th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Height</th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Weight</th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">BMI</th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Category</th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Pulse</th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-50">
                  {bmiRecords.map((r) => {
                    const dt = new Date(r.createdAt);
                    const catStyle = bmiCategoryStyle(r.bmiCategory);
                    const pulseLabel = r.pulseRate < 60 ? "Bradycardia" : r.pulseRate <= 100 ? "Normal" : "Tachycardia";
                    const pulseColor = r.pulseRate < 60 ? "text-blue-600" : r.pulseRate <= 100 ? "text-emerald-600" : "text-red-600";
                    return (
                      <tr key={r.id} className="hover:bg-sky-50/40 transition">
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                          <span className="ml-1.5 text-slate-400">{dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{r.height} cm</td>
                        <td className="px-4 py-3 text-slate-700">{r.weight} kg</td>
                        <td className="px-4 py-3 text-xl font-black text-slate-900">{r.bmi.toFixed(1)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-xl border px-3 py-1 text-xs font-bold ${catStyle}`}>{r.bmiCategory}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${pulseColor}`}>{r.pulseRate} bpm</span>
                          <span className="ml-1.5 text-xs text-slate-400">({pulseLabel})</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{r.recordedBy?.fullName ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function HistoryMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  detail: string;
  tone: "blue" | "emerald" | "amber" | "slate";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-sky-100 bg-sky-50 text-sky-600"
      : tone === "amber"
      ? "border-sky-100 bg-white text-sky-600"
      : tone === "slate"
      ? "border-slate-200 bg-slate-50 text-slate-700"
      : "border-sky-100 bg-sky-50 text-sky-600";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] opacity-70">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-black leading-tight">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold opacity-70">{detail}</p>
    </div>
  );
}

function HistoryFlag({
  label,
  value,
  tone = "blue",
  updatedBy,
  updatedAt,
  selfReportedBy,
}: {
  label: string;
  value?: boolean | null;
  tone?: "blue" | "emerald" | "amber" | "rose";
  updatedBy?: string;
  updatedAt?: string;
  selfReportedBy?: string;
}) {
  const recorded = value !== null && value !== undefined;
  const active = value === true;

  const activeClass =
    tone === "emerald"
      ? "border-sky-200 bg-sky-50 text-sky-600"
      : tone === "amber"
      ? "border-sky-200 bg-white text-sky-600"
      : tone === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-sky-200 bg-sky-50 text-sky-600";

  const className = !recorded
    ? "border-slate-200 bg-slate-50 text-slate-500"
    : active
    ? activeClass
    : "border-slate-200 bg-white text-slate-600";

  return (
    <div className={`rounded-2xl border px-3 py-2.5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-800">{label}</span>
        <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-xs font-black">
          {!recorded ? "Not recorded" : active ? "Yes" : "No"}
        </span>
      </div>
      {active && (updatedBy ? (
        <p className="mt-1.5 text-[11px] font-semibold leading-tight text-slate-500">
          Status set by Dr. {updatedBy}
          {updatedAt ? ` · ${updatedAt}` : ""}
        </p>
      ) : selfReportedBy ? (
        <p className="mt-1.5 text-[11px] font-semibold leading-tight text-slate-500">
          Self-reported by {selfReportedBy} at registration
        </p>
      ) : null)}
    </div>
  );
}

function RequestAppointmentModal({
  selectedAvailability,
  selectedAvailableSlots,
  selectedQueueNumber,
  form,
  formLoading,
  setForm,
  onClose,
  onSubmit,
}: {
  selectedAvailability: AvailableDoctor;
  selectedAvailableSlots: AvailableDoctor["slots"];
  selectedQueueNumber: number | null;
  form: {
    availabilityId: string;
    time: string;
    reason: string;
    otherReason: string;
  };
  formLoading: boolean;
  setForm: React.Dispatch<
    React.SetStateAction<{
      availabilityId: string;
      time: string;
      reason: string;
      otherReason: string;
    }>
  >;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed left-0 top-0 z-[999999] flex h-screen w-screen items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[30px] bg-white shadow-2xl">
        <div className="rounded-t-[30px] border-b border-sky-100 bg-gradient-to-br from-sky-50 to-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-200">
                <CalendarCheck className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Request Appointment
                </h3>
                <p className="text-sm font-semibold text-slate-500">
                  Dr. {selectedAvailability.doctor.fullName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-500 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              ✕
            </button>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="max-h-[75vh] space-y-4 overflow-y-auto p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                Date
              </label>
              <input
                value={formatLongDate(selectedAvailability.date)}
                disabled
                className="min-h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                Time
              </label>
              <select
                value={form.time}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, time: e.target.value }))
                }
                className="min-h-[52px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
              >
                {selectedAvailableSlots.map((slot) => (
                  <option key={slot.time} value={slot.time}>
                    {formatTime(slot.time)} - Queue #{slot.queueNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedQueueNumber && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-600">
              Your queue number will be #{selectedQueueNumber}.
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              Reason
            </label>
            <select
              value={form.reason}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  reason: e.target.value,
                  otherReason: "",
                }))
              }
              className="min-h-[52px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
            >
              {appointmentReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {form.reason === "Others" && (
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                Type Reason
              </label>
              <input
                value={form.otherReason}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    otherReason: e.target.value,
                  }))
                }
                placeholder="Enter your reason"
                className="min-h-[52px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-slate-100 px-6 py-3 text-sm font-black text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={formLoading}
              className="rounded-2xl bg-[#0EA5E9] px-6 py-3 text-sm font-black text-white shadow-lg shadow-sky-500/25 hover:bg-sky-600 disabled:opacity-60"
            >
              {formLoading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}



function ResidentSuggestionsModal({
  appointments,
  onClose,
}: {
  appointments: ResidentAppointment[];
  onClose: () => void;
}) {
  if (typeof window === "undefined") return null;
  return createPortal(
  <div className="fixed left-0 top-0 z-[999999] flex h-screen w-screen items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
        <div className="w-full max-w-2xl rounded-[30px] bg-white shadow-2xl">
          <div className="rounded-t-[30px] border-b border-sky-100 bg-gradient-to-br from-sky-50 to-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-200">
                  <Bell className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Doctor Suggestions
                  </h3>
                  <p className="text-sm font-semibold text-slate-500">
                    Appointment notifications and advice
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-500 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
            {appointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50 p-6 text-center text-sm font-semibold text-slate-500">
                No doctor suggestions yet.
              </div>
            ) : (
              appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-black text-slate-900">
                        Dr. {appointment.doctor?.fullName || "Doctor"}
                      </h4>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {formatLongDate(appointment.date)} •{" "}
                        {formatTime(appointment.time)} • Queue #
                        {appointment.queueNumber || "-"}
                      </p>
                    </div>

                    <StatusBadge status={appointment.status} />
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-wide text-sky-600">
                      Doctor Suggestion
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-7 text-slate-800">
                      {appointment.suggestion}
                    </p>
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Appointment Reason
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {appointment.reason === "Others"
                        ? appointment.otherReason
                        : appointment.reason}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    
    ,
  document.body
);
}



function AppointmentMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-sky-200 bg-gradient-to-br from-white to-sky-50/40 p-5 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-200">
        {icon}
      </div>

      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
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

function DigitalIdCard({
  resident,
}: {
  resident: ResidentData;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await htmlToImage.toPng(cardRef.current, { pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = `digital-id-${resident.lastName || "resident"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download card", err);
    } finally {
      setDownloading(false);
    }
  };

  const { qrImageUrl, loading: qrLoading } = useSecureQrUrl(resident.id);

  return (
    <div className="flex flex-col items-center justify-center pb-6 pt-2">
      <div 
        ref={cardRef}
        className="relative h-[215px] w-[340px] overflow-hidden rounded-[18px] border border-sky-200 bg-white font-sans shadow-[0_18px_45px_rgba(14,165,233,0.18)] sm:h-[316px] sm:w-[500px] sm:rounded-[24px] lg:aspect-[760/480] lg:h-auto lg:w-full lg:max-w-[760px] lg:rounded-[30px]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#F8FBFF_0%,#FFFFFF_42%,#EEF6FF_100%)]" />
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#0EA5E9_0%,#38BDF8_55%,#BAE6FD_100%)] sm:h-2 lg:h-2.5" />
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[linear-gradient(180deg,#0EA5E9_0%,#38BDF8_55%,#BAE6FD_100%)] sm:w-2 lg:w-2.5" />
        <div className="absolute right-[-42px] top-[-60px] h-[150px] w-[150px] rounded-full border-[22px] border-sky-100/70 sm:right-[-58px] sm:top-[-82px] sm:h-[230px] sm:w-[230px] sm:border-[34px] lg:right-[-78px] lg:top-[-108px] lg:h-[320px] lg:w-[320px] lg:border-[48px]" />
        <div className="absolute bottom-[-58px] left-[70px] h-[150px] w-[150px] rounded-full border-[18px] border-sky-50/80 sm:bottom-[-86px] sm:left-[110px] sm:h-[220px] sm:w-[220px] sm:border-[26px] lg:bottom-[-120px] lg:left-[170px] lg:h-[300px] lg:w-[300px] lg:border-[36px]" />
        <div className="absolute inset-0 opacity-[0.18]">
          <div className="h-full w-full bg-[repeating-linear-gradient(125deg,rgba(37,99,235,0.16)_0px,rgba(37,99,235,0.16)_1px,transparent_1px,transparent_12px)] lg:bg-[repeating-linear-gradient(125deg,rgba(37,99,235,0.15)_0px,rgba(37,99,235,0.15)_1px,transparent_1px,transparent_16px)]" />
        </div>
        <div className="absolute left-[56%] top-[53%] -translate-x-1/2 -translate-y-1/2 opacity-[0.16] mix-blend-multiply [mask-image:radial-gradient(circle,black_0%,black_50%,transparent_76%)]">
          <img
            src="/images/davao-logo.png"
            alt="Watermark"
            className="h-[250px] w-[250px] object-contain contrast-125 saturate-75 sm:h-[380px] sm:w-[380px] lg:h-[540px] lg:w-[540px]"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_56%_53%,rgba(219,234,254,0.08)_0%,rgba(255,255,255,0.20)_38%,rgba(248,251,255,0.84)_74%,rgba(248,251,255,0.94)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.76)_0%,rgba(255,255,255,0.22)_38%,rgba(255,255,255,0.58)_100%)]" />

        <div className="relative z-10 flex h-full flex-col p-3 pl-4 sm:p-5 sm:pl-6 lg:p-7 lg:pl-9">
          <div className="flex items-center justify-between border-b border-sky-100/90 pb-2 sm:pb-3 lg:pb-4">
            <img
              src="/images/davao-logo.png"
              alt="Barangay logo"
              className="h-9 w-9 object-contain drop-shadow-sm sm:h-14 sm:w-14 lg:h-[74px] lg:w-[74px]"
            />
            <div className="flex-1 px-2 text-center sm:px-4">
              <p className="text-[7px] font-black leading-tight text-slate-800 sm:text-[10px] lg:text-[13px]">REPUBLIC OF THE PHILIPPINES</p>
              <p className="text-[7px] font-black leading-tight text-slate-800 sm:text-[10px] lg:text-[13px]">BARANGAY 19-B HEALTH OFFICE</p>
              <h2 className="mt-1 text-[11px] font-black uppercase tracking-wide text-sky-900 sm:text-[17px] lg:text-[25px]">BARANGAY HEALTH DIGITAL ID</h2>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-sm ring-1 ring-sky-100 sm:h-14 sm:w-14 sm:rounded-2xl lg:h-[74px] lg:w-[74px] lg:rounded-[22px]">
              <HealthLogoIcon className="h-7 w-7 sm:h-11 sm:w-11 lg:h-14 lg:w-14" />
            </div>
          </div>

          <div className="flex flex-1 gap-3 pt-3 sm:gap-5 sm:pt-5 lg:gap-8 lg:pt-6">
            <div className="flex w-[92px] shrink-0 flex-col items-center sm:w-[142px] lg:w-[205px]">
              <div className="w-full rounded-xl border border-sky-100 bg-white p-1 shadow-[0_10px_24px_rgba(15,23,42,0.12)] sm:rounded-2xl sm:p-2 lg:rounded-[24px] lg:p-3">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="Encrypted health record QR code"
                    className="aspect-square h-auto w-full object-contain"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-slate-100 text-[8px] font-bold text-slate-400">
                    {qrLoading ? "Securing QR..." : "QR unavailable"}
                  </div>
                )}
              </div>
              <p className="mt-1.5 text-center text-[7px] font-bold leading-tight text-slate-500 sm:mt-2 sm:text-[10px] lg:mt-3 lg:text-[13px]">Scan for Health Record</p>
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-start">
              <div className="mb-1.5 rounded-lg border border-sky-100/70 bg-white/70 px-2 py-1.5 shadow-sm backdrop-blur-sm sm:mb-2.5 sm:rounded-xl sm:px-3 sm:py-2 lg:mb-4 lg:rounded-2xl lg:px-4 lg:py-3">
                <p className="text-[6px] font-black uppercase text-sky-900 sm:text-[8px] lg:text-[11px]">Last Name, First Name, Middle Name</p>
                <h3 className="text-[12px] font-black uppercase leading-tight text-slate-950 sm:text-[18px] lg:text-[27px]">
                  {formatIdName(resident)}
                </h3>
              </div>

              <div className="mb-1.5 grid grid-cols-[30%_24%_46%] gap-x-1 sm:mb-2.5 sm:gap-x-2 lg:mb-4 lg:gap-x-4">
                <div className="flex min-w-0 flex-col">
                  <p className="text-[6px] font-black uppercase text-sky-600 sm:text-[8px] lg:text-[11px]">Nationality</p>
                  <p className="text-[9px] font-black uppercase text-slate-950 sm:text-[13px] lg:text-[19px]">PHL</p>
                </div>
                <div className="flex min-w-0 flex-col">
                  <p className="text-[6px] font-black uppercase text-sky-600 sm:text-[8px] lg:text-[11px]">Sex</p>
                  <p className="truncate text-[9px] font-black uppercase text-slate-950 sm:text-[13px] lg:text-[19px]">{resident.sex}</p>
                </div>
                <div className="flex min-w-0 flex-col">
                  <p className="text-[6px] font-black uppercase text-sky-600 sm:text-[8px] lg:text-[11px]">Date of Birth</p>
                  <p className="truncate text-[9px] font-black uppercase text-slate-950 sm:text-[13px] lg:text-[19px]">{formatDate(resident.birthDate)}</p>
                </div>
              </div>

              <div className="mb-1.5 sm:mb-2.5 lg:mb-4">
                <p className="text-[6px] font-black uppercase text-sky-600 sm:text-[8px] lg:text-[11px]">Address</p>
                <p className="line-clamp-2 text-[9px] font-black uppercase leading-[1.2] text-slate-950 sm:text-[13px] lg:text-[20px]">
                  {resident.completeAddress}
                </p>
              </div>

              <div className="grid grid-cols-[30%_32%_38%] gap-x-1 sm:gap-x-2 lg:gap-x-4">
                <div className="flex min-w-0 flex-col">
                  <p className="text-[6px] font-black uppercase text-sky-600 sm:text-[8px] lg:text-[11px]">Civil Status</p>
                  <p className="truncate text-[9px] font-black uppercase text-slate-950 sm:text-[13px] lg:text-[19px]">{resident.civilStatus || "-"}</p>
                </div>
                <div className="flex min-w-0 flex-col">
                  <p className="text-[6px] font-black uppercase text-sky-600 sm:text-[8px] lg:text-[11px]">Religion</p>
                  <p className="truncate text-[9px] font-black uppercase text-slate-950 sm:text-[13px] lg:text-[19px]">{resident.religion || "-"}</p>
                </div>
                <div className="flex min-w-0 flex-col">
                  <p className="text-[6px] font-black uppercase text-sky-600 sm:text-[8px] lg:text-[11px]">Occupation</p>
                  <p className="truncate text-[9px] font-black uppercase text-slate-950 sm:text-[13px] lg:text-[19px]">{resident.occupation || "-"}</p>
                </div>
              </div>
              
              <div className="mt-auto flex justify-end">
                <div className="rounded-lg bg-sky-900 px-2 py-1 text-right shadow-sm sm:rounded-xl sm:px-3 sm:py-1.5 lg:rounded-2xl lg:px-4 lg:py-2">
                  <p className="text-[5px] font-black uppercase text-sky-100 sm:text-[7px] lg:text-[10px]">Agency Code</p>
                  <p className="text-[8px] font-black uppercase text-white sm:text-[11px] lg:text-[16px]">B19B</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 w-[340px] sm:w-[500px] lg:w-full lg:max-w-[760px]">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0EA5E9] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:bg-sky-600 disabled:opacity-60 lg:py-4 lg:text-base"
        >
          {downloading ? "Saving Card Image..." : "Download Digital ID"}
        </button>
      </div>
    </div>
  );
}

function HealthLogoIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <path
        d="M20 34c-6.5 0-11-5-11-11 0-5.5 4.3-10 9.8-10 4 0 7.3 2.3 9 5.6C29.7 15.3 33 13 37 13c5.5 0 9.8 4.5 9.8 10 0 6-4.5 11-11 11H20z"
        fill="#BAE6FD"
      />
      <circle cx="45" cy="16" r="7" fill="#0EA5E9" />
      <circle cx="22" cy="14" r="6" fill="#38BDF8" />
      <path
        d="M31 28c-10 0-18 8-18 18v5h36v-5c0-10-8-18-18-18z"
        fill="#0EA5E9"
        opacity="0.95"
      />
      <circle cx="31" cy="29" r="10" fill="white" />
      <path
        d="M31 21v16M23 29h16"
        stroke="#EF4444"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

type IdentityField = {
  label: string;
  value: unknown;
  onChange?: (value: string) => void;
  type?: string;
  options?: string[];
};

type IdentityGroupData = {
  title: string;
  icon: React.ReactNode;
  fields: IdentityField[];
};

function ResidentIdentityCard({
  resident,
  fullName,
  editMode,
  onChange,
}: {
  resident: ResidentData;
  fullName: string;
  editMode?: boolean;
  onChange: (key: keyof ResidentData, value: string | number) => void;
}) {
  const groups: IdentityGroupData[] = [
    {
      title: "Personal Details",
      icon: <UserIcon className="h-4 w-4" />,
      fields: [
        { label: "Full Name", value: fullName },
        { label: "Age", value: resident.age, type: "number", onChange: (v) => onChange("age", Number(v)) },
        { label: "Sex", value: resident.sex, options: ["MALE", "FEMALE"], onChange: (v) => onChange("sex", v) },
        { label: "Birthday", value: resident.birthDate?.slice(0, 10), type: "date", onChange: (v) => onChange("birthDate", v) },
        { label: "Civil Status", value: resident.civilStatus, onChange: (v) => onChange("civilStatus", v) },
        { label: "Religion", value: resident.religion, onChange: (v) => onChange("religion", v) },
        { label: "Education", value: resident.educationalAttainment, onChange: (v) => onChange("educationalAttainment", v) },
        { label: "Occupation", value: resident.occupation, onChange: (v) => onChange("occupation", v) },
      ],
    },
    {
      title: "Contact & Family",
      icon: <PhoneIcon className="h-4 w-4" />,
      fields: [
        { label: "Contact No.", value: resident.contactNumber, onChange: (v) => onChange("contactNumber", v) },
        { label: "Email", value: resident.email, onChange: (v) => onChange("email", v) },
        { label: "Accompanying Person", value: resident.accompanyingPerson, onChange: (v) => onChange("accompanyingPerson", v) },
        { label: "Relationship", value: resident.relationship, onChange: (v) => onChange("relationship", v) },
        { label: "Spouse Maiden Name", value: resident.spouseMaidenName, onChange: (v) => onChange("spouseMaidenName", v) },
        { label: "Spouse Occupation", value: resident.spouseOccupation, onChange: (v) => onChange("spouseOccupation", v) },
        { label: "Spouse Contact No.", value: resident.spouseContactNumber, onChange: (v) => onChange("spouseContactNumber", v) },
      ],
    },
    {
      title: "Address",
      icon: <LocationIcon className="h-4 w-4" />,
      fields: [
        { label: "Street", value: getStreetOnly(resident.completeAddress), onChange: (v) => onChange("completeAddress", v) },
        { label: "Barangay", value: resident.barangayName, onChange: (v) => onChange("barangayName", v) },
        { label: "City", value: resident.city, onChange: (v) => onChange("city", v) },
        { label: "Province", value: "Davao del Norte" },
      ],
    },
  ];

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
        <IdentityGroup group={groups[0]} editMode={editMode} />
        <div className="space-y-8">
          <IdentityGroup group={groups[1]} editMode={editMode} />
          <IdentityGroup group={groups[2]} editMode={editMode} />
        </div>
      </div>
    </div>
  );
}

function IdentityGroup({
  group,
  editMode,
}: {
  group: IdentityGroupData;
  editMode?: boolean;
}) {
  const visibleFields = editMode
    ? group.fields
    : group.fields.filter((field) => hasDisplayValue(field.value));

  if (visibleFields.length === 0) return null;

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100">
          {group.icon}
        </span>
        <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
          {group.title}
        </h4>
      </div>

      <dl className="divide-y divide-slate-100">
        {visibleFields.map((field) => (
          <IdentityRow
            key={field.label}
            label={field.label}
            value={field.value}
            editMode={editMode && !!field.onChange}
            onChange={field.onChange}
            type={field.type}
            options={field.options}
          />
        ))}
      </dl>
    </div>
  );
}

function IdentityRow({
  label,
  value,
  editMode,
  onChange,
  type = "text",
  options,
}: {
  label: string;
  value: unknown;
  editMode?: boolean;
  onChange?: (value: string) => void;
  type?: string;
  options?: string[];
}) {
  if (editMode) {
    return (
      <div className="py-3">
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </label>
        {options ? (
          <select
            value={String(value ?? "")}
            onChange={(e) => onChange?.(e.target.value)}
            className="min-h-[42px] w-full rounded-xl border border-sky-200 bg-white px-3 text-[15px] font-semibold text-slate-900 outline-none focus:border-sky-500"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={String(value ?? "")}
            onChange={(e) => onChange?.(e.target.value)}
            className="min-h-[42px] w-full rounded-xl border border-sky-200 bg-white px-3 text-[15px] font-semibold text-slate-900 outline-none focus:border-sky-500"
          />
        )}
      </div>
    );
  }

  const display = hasDisplayValue(value) ? String(value).trim() : "—";

  return (
    <div className="flex items-baseline justify-between gap-6 py-3">
      <dt className="shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="break-words text-right text-sm font-bold text-slate-900">
        {display}
      </dd>
    </div>
  );
}

type HealthFlagItem = {
  label: string;
  value: unknown;
  tone?: "good" | "bad";
};

function HealthInfoGroup({
  title,
  icon,
  items,
  tone = "good",
  columns = 1,
}: {
  title: string;
  icon: React.ReactNode;
  items: HealthFlagItem[];
  tone?: "good" | "bad";
  columns?: 1 | 2;
}) {
  const visible = items.filter((item) =>
    typeof item.value === "boolean" ? true : hasDisplayValue(item.value)
  );

  if (visible.length === 0) return null;

  const headerBadge =
    tone === "bad"
      ? "bg-rose-50 text-rose-600 ring-rose-100"
      : "bg-emerald-50 text-emerald-600 ring-emerald-100";

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2.5">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ${headerBadge}`}
        >
          {icon}
        </span>
        <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
          {title}
        </h4>
      </div>

      <div className={columns === 2 ? "grid sm:grid-cols-2 sm:gap-x-10" : ""}>
        {visible.map((item) => {
          const isBool = typeof item.value === "boolean";
          const itemTone = item.tone ?? tone;

          return (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 border-b border-slate-100 py-3"
            >
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
                <span className="break-words text-right text-sm font-bold text-slate-900">
                  {String(item.value)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const tabs = [
  {
    id: "identifying",
    label: "Identifying Data",
    icon: <UserIcon className="h-5 w-5" />,
    activeClass:
      "bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/30",
    idleClass: "text-sky-600 hover:bg-sky-50",
  },
  {
    id: "family",
    label: "Family History",
    icon: <FamilyIcon className="h-5 w-5" />,
    activeClass:
      "bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/30",
    idleClass: "text-sky-600 hover:bg-sky-50",
  },
  {
    id: "personal",
    label: "Personal / Social History",
    icon: <LifestyleIcon className="h-5 w-5" />,
    activeClass:
      "bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/30",
    idleClass: "text-sky-600 hover:bg-sky-50",
  },
];

function Section({
  title,
  subtitle,
  icon,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6 grid items-start gap-3 md:grid-cols-[auto_1fr_auto]">
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-200">
            {icon}
          </div>
        )}

        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>

        {right && <div>{right}</div>}
      </div>

      {children}
    </div>
  );
}

function hasDisplayValue(value: unknown) {
  if (value === null || value === undefined) return false;
  return String(value).trim() !== "";
}

function getStreetOnly(address?: string | null) {
  if (!address) return null;
  return address.split(",")[0]?.trim() || null;
}

function formatDate(date?: string | null) {
  if (!date) return null;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return date;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}

function formatIdName(resident: ResidentData) {
  const middle = resident.middleName ? ` ${resident.middleName}` : "";
  return `${resident.lastName}, ${resident.firstName}${middle}`.trim();
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

function getAppointmentSortValue(appointment: ResidentAppointment) {
  const datePart = String(appointment.date).slice(0, 10);
  const timePart = appointment.time || "00:00";
  const parsed = new Date(`${datePart}T${timePart}`);

  if (!Number.isNaN(parsed.getTime())) return parsed.getTime();

  const fallback = new Date(appointment.date);
  return Number.isNaN(fallback.getTime()) ? 0 : fallback.getTime();
}

function getAppointmentReason(appointment: ResidentAppointment) {
  if (appointment.reason === "Others") {
    return appointment.otherReason || "Others";
  }

  return appointment.reason || "-";
}

function ShieldIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function IdCardIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6.5 16a3.5 3.5 0 0 1 5 0" />
      <path d="M14 10h4" />
      <path d="M14 14h4" />
    </svg>
  );
}

function UserIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PhoneIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.46-1.29a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function LocationIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function MedicalIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3v3" />
      <path d="M16 3v3" />
      <path d="M3 8h18" />
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M12 11v6" />
      <path d="M9 14h6" />
    </svg>
  );
}

function FamilyIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LifestyleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 20h12" />
      <path d="M8 20V10" />
      <path d="M16 20V4" />
      <path d="M12 20v-6" />
    </svg>
  );
}

function VerifiedIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2l2.4 2.1 3.1-.5 1.3 2.8 2.8 1.3-.5 3.1L22 12l-2.1 2.4.5 3.1-2.8 1.3-1.3 2.8-3.1-.5L12 22l-2.4-2.1-3.1.5-1.3-2.8-2.8-1.3.5-3.1L2 12l2.1-2.4-.5-3.1 2.8-1.3 1.3-2.8 3.1.5L12 2zm-1.1 13.6l5.7-5.7-1.4-1.4-4.3 4.3-2-2-1.4 1.4 3.4 3.4z" />
    </svg>
  );
}
