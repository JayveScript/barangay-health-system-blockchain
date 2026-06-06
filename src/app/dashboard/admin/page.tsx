"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import * as htmlToImage from "html-to-image";
import {
  Activity,
  ClipboardList,
  IdCard,
  Edit,
  Eye,
  FileText,
  HeartPulse,
  KeyRound,
  LogOut,
  MapPin,
  Menu,
  Phone,
  PieChart as PieChartIcon,
  Save,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  Megaphone,
CalendarDays,
ImageIcon,
PlusCircle,
  ScanLine,
  Search,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  
} from "recharts";
import {
  BARANGAY_ADMIN_USERNAME_SUFFIX,
  getBarangayHcmsUsernameLocalPart,
  normalizeBarangayHcmsUsername,
} from "@/lib/username-validation";

type ResidentRecord = {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  sex: string;
  age: number;
  barangayName: string;
  city?: string | null;
  contactNumber?: string | null;
  religion?: string | null;
  birthDate?: string;
  completeAddress?: string | null;
  civilStatus?: string | null;
  educationalAttainment?: string | null;
  occupation?: string | null;
  accompanyingPerson?: string | null;
  relationship?: string | null;
  spouseMaidenName?: string | null;
  spouseOccupation?: string | null;
  spouseContactNumber?: string | null;
  createdAt: string;
  user?: {
    email?: string | null;
    isVerified: boolean;
  };
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

type StaffUser = {
  id: string;
  fullName?: string;
  username: string;
  role: string;
  createdAt: string;
  barangay?: {
    name: string;
  } | null;
};

type AdminCurrentUser = {
  id: string;
  fullName?: string | null;
  username: string;
  role: string;
  email?: string | null;
  phoneNumber?: string | null;
  isVerified: boolean;
  createdAt: string;
  barangay?: {
    name: string;
  } | null;
};

type DashboardData = {
  stats: {
    totalResidents: number;
    totalStaff: number;
    totalVerifiedResidents: number;
  };
  barangay?: {
    name: string;
    municipality?: string | null;
  } | null;
  residents: ResidentRecord[];
  staffUsers: StaffUser[];
};

type SecureAction = "edit" | "delete" | null;

const chartColors = ["#0EA5E9", "#38BDF8", "#10B981", "#F59E0B", "#EF4444"];
const sexDistributionColors = ["#075985", "#7DD3FC", "#94A3B8"];
const FALLBACK_BARANGAY_LABEL = "Assigned Barangay";

import { QrScannerTab } from "@/components/QrScannerTab";
import { useSecureQrUrl } from "@/hooks/useSecureQrUrl";
import { ProfileInfoPanel } from "@/components/dashboard/ProfileInfoPanel";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<
  | "overview"
  | "personal"
  | "residents"
  | "create-user"
  | "staff-users"
  | "announcements"
  | "scan-qr"
>("overview");

  const [data, setData] = useState<DashboardData | null>(null);
  const [adminUser, setAdminUser] = useState<AdminCurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [selectedResident, setSelectedResident] = useState<ResidentRecord | null>(
    null
  );
  const [residentModalOpen, setResidentModalOpen] = useState(false);
  const [residentEditMode, setResidentEditMode] = useState(false);
  const [residentEditPassword, setResidentEditPassword] = useState("");
  const [residentModalTab, setResidentModalTab] = useState<
    "identifying" | "medical" | "family" | "personal"
  >("identifying");
  const [digitalIdResident, setDigitalIdResident] = useState<ResidentRecord | null>(
    null
  );

  const [secureModalOpen, setSecureModalOpen] = useState(false);
  const [secureAction, setSecureAction] = useState<SecureAction>(null);
  const [secureResident, setSecureResident] = useState<ResidentRecord | null>(
    null
  );
  const [securePassword, setSecurePassword] = useState("");
  const [secureLoading, setSecureLoading] = useState(false);
  const [secureError, setSecureError] = useState("");
  const [residentSearch, setResidentSearch] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
    role: "STAFF",
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const currentBarangayName =
    data?.barangay?.name ||
    adminUser?.barangay?.name ||
    FALLBACK_BARANGAY_LABEL;

  useEffect(() => {
    fetchDashboard();
    fetchAdminUser();
  }, []);

  const adminInitials = useMemo(() => {
    if (!adminUser?.fullName) return "AD";

    return adminUser.fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((name) => name[0]?.toUpperCase())
      .join("");
  }, [adminUser?.fullName]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json();

      if (!res.ok || !json?.stats) {
        setData(null);
        setError(json?.error || "Failed to load dashboard.");
        return;
      }

      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUser = async () => {
    try {
      const res = await fetch("/api/users/me");
      const json = await res.json();

      if (res.ok) {
        setAdminUser(json);
      }
    } catch (err) {
      console.error("ADMIN_USER_PROFILE_ERROR", err);
    }
  };

  const sexData = useMemo(() => {
  const residents = data?.residents ?? [];

  const male = residents.filter(
    (r) => String(r.sex || "").toUpperCase() === "MALE"
  ).length;

  const female = residents.filter(
    (r) => String(r.sex || "").toUpperCase() === "FEMALE"
  ).length;

  const other = residents.length - male - female;

  return [
    { name: "Male", value: male },
    { name: "Female", value: female },
    { name: "Other / Not Set", value: other },
  ];
}, [data]);

  const ageGroupData = useMemo(() => {
    const groups: Record<string, number> = {
      "0-12": 0,
      "13-17": 0,
      "18-35": 0,
      "36-59": 0,
      "60+": 0,
    };

    for (const r of data?.residents ?? []) {
      if (r.age <= 12) groups["0-12"]++;
      else if (r.age <= 17) groups["13-17"]++;
      else if (r.age <= 35) groups["18-35"]++;
      else if (r.age <= 59) groups["36-59"]++;
      else groups["60+"]++;
    }

    return Object.entries(groups).map(([name, total]) => ({ name, total }));
  }, [data]);

  const roleData = useMemo(() => {
    const map: Record<string, number> = {};

    for (const u of data?.staffUsers ?? []) {
      map[u.role] = (map[u.role] || 0) + 1;
    }

    return Object.entries(map).map(([name, total]) => ({ name, total }));
  }, [data]);

  const recentResidents = useMemo(() => {
    return [...(data?.residents ?? [])].slice(0, 5);
  }, [data]);

  const filteredResidents = useMemo(() => {
  const query = residentSearch.toLowerCase().trim();

  if (!query) return data?.residents ?? [];

  return (data?.residents ?? []).filter((resident) => {
    const fullName = `${resident.firstName} ${resident.middleName ?? ""} ${resident.lastName}`.toLowerCase();

    return (
      fullName.includes(query) ||
      resident.sex.toLowerCase().includes(query) ||
      String(resident.age).includes(query) ||
      resident.contactNumber?.toLowerCase().includes(query)
    );
  });
}, [data, residentSearch]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setFormLoading(true);

      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          username: normalizeBarangayHcmsUsername(form.username),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to create user.");
        return;
      }

      setMessage("User created successfully.");

      setForm({
        fullName: "",
        username: "",
        password: "",
        role: "STAFF",
      });

      fetchDashboard();
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setFormLoading(false);
    }
  };

  const openResidentDetails = (resident: ResidentRecord) => {
    setSelectedResident(resident);
    setResidentEditMode(false);
    setResidentEditPassword("");
    setResidentModalTab("identifying");
    setResidentModalOpen(true);
  };

  const openResidentDigitalId = (resident: ResidentRecord) => {
    setDigitalIdResident(resident);
  };

  const openSecureModal = (resident: ResidentRecord, action: SecureAction) => {
    setSecureResident(resident);
    setSecureAction(action);
    setSecurePassword("");
    setSecureError("");
    setSecureModalOpen(true);
  };

  const closeSecureModal = () => {
    if (secureLoading) return;

    setSecureModalOpen(false);
    setSecureResident(null);
    setSecureAction(null);
    setSecurePassword("");
    setSecureError("");
  };

  const confirmSecureAction = async () => {
  if (!secureResident || !secureAction) return;

  if (!securePassword.trim()) {
    setSecureError("Admin password is required.");
    return;
  }

  try {
    setSecureLoading(true);
    setSecureError("");

    const verifyRes = await fetch("/api/admin/verify-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: securePassword,
      }),
    });

    const verifyJson = await readJsonSafe(verifyRes);

    if (!verifyRes.ok) {
      setSecureError(verifyJson.error || "Invalid admin password.");
      return;
    }

    if (secureAction === "edit") {
      setSelectedResident(secureResident);
      setResidentEditPassword(securePassword);
      setResidentEditMode(true);
      setResidentModalTab("identifying");
      setResidentModalOpen(true);
      closeSecureModal();
      return;
    }

    const deleteRes = await fetch(`/api/residents/${secureResident.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: securePassword,
      }),
    });

    const deleteJson = await readJsonSafe(deleteRes);

    if (!deleteRes.ok) {
      setSecureError(deleteJson.error || "Failed to delete resident.");
      return;
    }

    closeSecureModal();
    await fetchDashboard();
  } catch (err) {
    console.error(err);
    setSecureError("Unable to connect to the server.");
  } finally {
    setSecureLoading(false);
  }
};
  const adminBottomNavItems = [
    { id: "overview",      label: "Overview",   icon: <Activity className="h-5 w-5" /> },
    { id: "residents",     label: "Residents",  icon: <Users className="h-5 w-5" /> },
    { id: "create-user",   label: "Add User",   icon: <UserPlus className="h-5 w-5" /> },
    { id: "announcements", label: "News",       icon: <Megaphone className="h-5 w-5" /> },
    { id: "scan-qr",       label: "Scan QR",    icon: <ScanLine className="h-5 w-5" /> },
  ];

  return (
    <main className="min-h-screen bg-[#EFF6FF] p-4 pb-20 sm:p-6 lg:pb-6 lg:h-screen lg:overflow-hidden">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="mx-auto flex h-full max-w-7xl flex-col gap-6 lg:flex-row">
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
                <p className="text-xs text-slate-500">Admin Navigation</p>
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
              active={tab === "overview"}
              icon={<Activity className="h-5 w-5 shrink-0" />}
              label="Overview"
              onClick={() => {
                setTab("overview");
                setMobileSidebarOpen(false);
              }}
            />

            <SidebarButton
              active={tab === "personal"}
              icon={<UserRound className="h-5 w-5 shrink-0" />}
              label="Personal Info"
              onClick={() => {
                setTab("personal");
                setMobileSidebarOpen(false);
              }}
            />

            <SidebarButton
              active={tab === "residents"}
              icon={<Users className="h-5 w-5 shrink-0" />}
              label="Registered Residents"
              onClick={() => {
                setTab("residents");
                setMobileSidebarOpen(false);
              }}
            />

            <SidebarButton
              active={tab === "create-user"}
              icon={<UserPlus className="h-5 w-5 shrink-0" />}
              label="Create User"
              onClick={() => {
                setTab("create-user");
                setMobileSidebarOpen(false);
              }}
            />

            <SidebarButton
              active={tab === "staff-users"}
              icon={<Stethoscope className="h-5 w-5 shrink-0" />}
              label="Staff Users"
              onClick={() => {
                setTab("staff-users");
                setMobileSidebarOpen(false);
              }}
            />

            <SidebarButton
              active={tab === "announcements"}
              icon={<Megaphone className="h-5 w-5 shrink-0" />}
              label="Announcements"
              onClick={() => {
                setTab("announcements");
                setMobileSidebarOpen(false);
              }}
            />

            <SidebarButton
              active={tab === "scan-qr"}
              icon={<ScanLine className="h-5 w-5 shrink-0" />}
              label="Scan QR"
              onClick={() => {
                setTab("scan-qr");
                setMobileSidebarOpen(false);
              }}
            />
          </div>
        </aside>

        {/* Desktop sidebar */}
        <aside className="hidden shrink-0 rounded-[30px] border border-[#DCEAF7] bg-white p-4 text-slate-800 shadow-2xl shadow-sky-900/10 lg:block lg:h-full lg:w-[240px] lg:p-5 lg:overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <div className="rounded-[24px] border border-sky-200 bg-sky-50/60 p-4 lg:p-5">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25">
                <HeartPulse className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold">Health Portal</h2>
                <p className="text-sm text-slate-500">Admin Navigation</p>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <SidebarButton
                active={tab === "overview"}
                icon={<Activity className="h-5 w-5 shrink-0" />}
                label="Overview"
                onClick={() => setTab("overview")}
              />

              <SidebarButton
                active={tab === "personal"}
                icon={<UserRound className="h-5 w-5 shrink-0" />}
                label="Personal Info"
                onClick={() => setTab("personal")}
              />

              <SidebarButton
                active={tab === "residents"}
                icon={<Users className="h-5 w-5 shrink-0" />}
                label="Registered Residents"
                onClick={() => setTab("residents")}
              />

              <SidebarButton
                active={tab === "create-user"}
                icon={<UserPlus className="h-5 w-5 shrink-0" />}
                label="Create User"
                onClick={() => setTab("create-user")}
              />

              <SidebarButton
                active={tab === "staff-users"}
                icon={<Stethoscope className="h-5 w-5 shrink-0" />}
                label="Staff Users"
                onClick={() => setTab("staff-users")}
              />

              <SidebarButton
  active={tab === "announcements"}
  icon={<Megaphone className="h-5 w-5 shrink-0" />}
  label="Announcements"
  onClick={() => setTab("announcements")}
/>

              <SidebarButton
                active={tab === "scan-qr"}
                icon={<ScanLine className="h-5 w-5 shrink-0" />}
                label="Scan QR"
                onClick={() => setTab("scan-qr")}
              />

            </div>
          </div>
        </aside>

        <div className="flex-1 overflow-y-auto lg:h-full">
          <div className="rounded-[30px] border border-[#DCEAF7] bg-white p-4 shadow-2xl shadow-sky-900/10 sm:p-6">
            <div className="mb-5 rounded-[24px] border border-sky-200 bg-gradient-to-br from-white to-sky-50 p-4 shadow-lg shadow-sky-900/5 sm:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  {/* Mobile hamburger menu button */}
                  <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="lg:hidden flex h-11 w-11 items-center justify-center rounded-xl bg-[#0EA5E9] text-white hover:bg-sky-600"
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-2xl font-bold text-sky-600">
                    {adminInitials}
                  </div>

                  <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <h1 className="max-w-full whitespace-nowrap text-lg font-extrabold text-slate-900 sm:text-2xl">
                        BARANGAY ADMIN
                      </h1>

                      <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-[#0EA5E9] px-3 py-1 text-xs font-semibold text-white">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified Admin
                      </span>

                      <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600">
                        <MapPin className="h-3.5 w-3.5" />
                        {currentBarangayName}
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-snug text-slate-500 sm:text-sm">
                      Manage residents and health center users
                    </p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await fetch("/api/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Loading dashboard...</p>
            ) : (
              <>
                {error && !data && (
                  <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {error}
                  </div>
                )}

                {tab === "overview" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 [&>*]:min-w-0">
                      <StatCard
                        icon={<Users className="h-5 w-5" />}
                        label="Total Residents"
                        value={data?.stats?.totalResidents ?? 0}
                      />

                      <StatCard
                        icon={<ShieldCheck className="h-5 w-5" />}
                        label="Verified Residents"
                        value={data?.stats?.totalVerifiedResidents ?? 0}
                      />

                      <StatCard
                        icon={<Stethoscope className="h-5 w-5" />}
                        label="Health Staff Users"
                        value={data?.stats?.totalStaff ?? 0}
                      />
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <ChartCard
                        icon={<PieChartIcon className="h-5 w-5" />}
                        title="Resident Sex Distribution"
                        subtitle="Current registered resident demographics"
                      >
                        <DashboardPieChart
                          data={sexData}
                          colors={sexDistributionColors}
                        />

                      </ChartCard>

                      <ChartCard
                        icon={<Users className="h-5 w-5" />}
                        title="Age Group Distribution"
                        subtitle="Resident population by age group"
                      >
                        <DashboardBarChart data={ageGroupData} />
                      </ChartCard>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                      <ChartCard
                        icon={<Activity className="h-5 w-5" />}
                        title="Recent Registered Residents"
                        subtitle="Latest verified resident accounts"
                      >
                        <div className="space-y-3">
                          {recentResidents.map((resident) => (
                            <div
                              key={resident.id}
                              className="flex items-center justify-between rounded-2xl bg-sky-50 p-4"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">
                                  {resident.firstName} {resident.lastName}
                                </p>

                                <p className="truncate text-sm text-slate-500">
                                  {resident.barangayName} • {resident.age} years
                                  old
                                </p>
                              </div>

                              <span className="ml-3 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {resident.user?.isVerified ? "Verified" : "Pending"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ChartCard>

                      <ChartCard
                        icon={<Stethoscope className="h-5 w-5" />}
                        title="Staff Role Distribution"
                        subtitle="Created health center user accounts"
                      >
                        <DashboardBarChart data={roleData} />
                      </ChartCard>
                    </div>
                  </div>
                )}

                {tab === "personal" && (
                  <div className="space-y-5">
                    <ProfileInfoPanel
                      fullName={adminUser?.fullName || "Barangay Admin"}
                      initials={adminInitials}
                      roleLabel="Barangay Administrator"
                      username={adminUser?.username}
                      email={adminUser?.email}
                      phoneNumber={adminUser?.phoneNumber}
                      barangayName={currentBarangayName}
                      isVerified={adminUser?.isVerified ?? true}
                      createdAt={adminUser?.createdAt}
                      eyebrow="Admin Profile"
                    />
                  </div>
                )}

                {tab === "scan-qr" && (
                  <div className="rounded-[24px] border border-sky-200 bg-white p-5">
                    <QrScannerTab />
                  </div>
                )}

                {tab === "residents" && (
                  <div className="rounded-[24px] border border-sky-200 bg-white p-5">
                   <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
  {/* LEFT SIDE */}
  <div className="flex items-center gap-3">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
      <ClipboardList className="h-6 w-6" />
    </div>

    <div>
      <h2 className="text-2xl font-bold text-slate-900">
        Registered Residents
      </h2>

      <p className="text-sm text-slate-500">
        View, edit, or delete registered resident accounts.
      </p>
    </div>
  </div>

  {/* RIGHT SIDE SEARCH */}
  <div className="relative w-full lg:max-w-sm">
    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

    <input
      type="text"
      value={residentSearch}
      onChange={(e) => setResidentSearch(e.target.value)}
      placeholder="Search name, contact, age..."
      className="min-h-[52px] w-full rounded-2xl border border-sky-200 bg-sky-50 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
    />
  </div>
</div>
                    {/* Mobile compact list - Name + Actions on one line */}
          <div className="space-y-2 md:hidden">
            <div className="px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Resident Name
            </div>

            {filteredResidents.length === 0 && (
              <div className="rounded-2xl bg-sky-50 px-4 py-6 text-center text-sm text-slate-500">
                No resident found.
              </div>
            )}

            {filteredResidents.map((resident) => (
              <div
                key={resident.id}
                className="flex items-center justify-between gap-2 rounded-2xl bg-sky-50 px-3 py-2.5 shadow-sm"
              >
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
                  {resident.lastName}, {resident.firstName?.[0]}.{resident.middleName ? ` ${resident.middleName[0]}.` : ""}
                </p>

                <div className="flex shrink-0 items-center gap-1">
                  <IconActionButton
                    label="View"
                    icon={<Eye className="h-3.5 w-3.5" />}
                    onClick={() => openResidentDetails(resident)}
                  />
                  <IconActionButton
                    label="ID"
                    icon={<IdCard className="h-3.5 w-3.5" />}
                    onClick={() => openResidentDigitalId(resident)}
                  />
                  <IconActionButton
                    label="Edit"
                    icon={<Edit className="h-3.5 w-3.5" />}
                    variant="warning"
                    onClick={() => openSecureModal(resident, "edit")}
                  />
                  <IconActionButton
                    label="Delete"
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    variant="danger"
                    onClick={() => openSecureModal(resident, "delete")}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop full table */}
                    <div className="hidden overflow-x-auto md:block">
  <table className="min-w-[800px] w-full table-fixed border-separate border-spacing-y-2">
    <thead>
      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
        <th className="w-[38%] px-3">Resident Name</th>
        <th className="w-[12%] px-3">Sex</th>
        <th className="w-[10%] px-3">Age</th>
        <th className="w-[18%] px-3">Contact</th>
        <th className="w-[12%] px-3">Status</th>
        <th className="w-[10%] px-3 text-center">Actions</th>
      </tr>
    </thead>
    <tbody>
    {filteredResidents.length === 0 && (
  <tr>
    <td colSpan={6} className="rounded-2xl bg-sky-50 px-4 py-6 text-center text-sm text-slate-500">
      No resident found.
    </td>
  </tr>
)}
      {filteredResidents.map((resident) => (
        <tr key={resident.id} className="bg-sky-50 shadow-sm">
          <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">
            <span className="block truncate whitespace-nowrap">
              {resident.firstName} {resident.middleName ?? ""}{" "}
              {resident.lastName}
            </span>
          </td>
          <td className="px-3 py-3 text-sm text-slate-600">{resident.sex}</td>
          <td className="px-3 py-3 text-sm text-slate-600">{resident.age}</td>
          <td className="px-3 py-3 text-sm text-slate-600">{resident.contactNumber || "\u2014"}</td>
          <td className="px-3 py-3">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {resident.user?.isVerified ? "Verified" : "Pending"}
            </span>
          </td>
          <td className="rounded-r-2xl px-3 py-3">
            <div className="flex items-center justify-center gap-2">
              <IconActionButton label="View Details" icon={<Eye className="h-4 w-4" />} onClick={() => openResidentDetails(resident)} />
              <IconActionButton label="View Digital ID" icon={<IdCard className="h-4 w-4" />} onClick={() => openResidentDigitalId(resident)} />
              <IconActionButton label="Edit Resident" icon={<Edit className="h-4 w-4" />} variant="warning" onClick={() => openSecureModal(resident, "edit")} />
              <IconActionButton label="Delete Resident" icon={<Trash2 className="h-4 w-4" />} variant="danger" onClick={() => openSecureModal(resident, "delete")} />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
                  </div>
                )}

                {tab === "create-user" && (
                  <div className="space-y-5">
                    <div className="rounded-[24px] border border-sky-200 bg-white p-5">
                      <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                          <UserPlus className="h-6 w-6" />
                        </div>

                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">
                            Create User
                          </h2>

                          <p className="text-sm text-slate-500">
                            Add a new staff, doctor, BHW, nurse, or midwife account.
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Input
                            label="Full Name"
                            value={form.fullName}
                            onChange={(v) =>
                              setForm((p) => ({ ...p, fullName: v }))
                            }
                          />

                          <Input
                            label="Username"
                            value={form.username}
                            onChange={(v) =>
                              setForm((p) => ({
                                ...p,
                                username: normalizeBarangayHcmsUsername(v),
                              }))
                            }
                            fixedSuffix={BARANGAY_ADMIN_USERNAME_SUFFIX}
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <Input
                            label="Password"
                            type="password"
                            value={form.password}
                            onChange={(v) =>
                              setForm((p) => ({ ...p, password: v }))
                            }
                          />

                          <Select
                            label="Role"
                            value={form.role}
                            onChange={(v) => setForm((p) => ({ ...p, role: v }))}
                            options={["STAFF", "DOCTOR", "BHW", "NURSE", "MIDWIFE"]}
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <ReadonlyBadgeInput
                            label="Barangay"
                            value={currentBarangayName}
                          />
                        </div>

                        {error && (
                          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                          </div>
                        )}

                        {message && (
                          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {message}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={formLoading}
                          className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[#0EA5E9] px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-60"
                        >
                          {formLoading ? "Creating..." : "Create User"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {tab === "staff-users" && (
                  <div className="rounded-[24px] border border-sky-200 bg-white p-5">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                        <Stethoscope className="h-6 w-6" />
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                          Existing Staff Users
                        </h2>

                        <p className="text-sm text-slate-500">
                          View all staff, doctor, BHW, nurse, and midwife accounts.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {data?.staffUsers?.map((user) => (
                        <div
                          key={user.id}
                          className="rounded-[24px] border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-sky-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-lg font-bold text-slate-900">
                                {user.fullName}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                {user.barangay?.name || currentBarangayName}
                              </p>
                            </div>

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0EA5E9] text-white shadow-sm">
                              <UserRound className="h-5 w-5" />
                            </div>
                          </div>

                          <div className="mt-5 flex items-center justify-between">
                            <span className="inline-flex rounded-full bg-[#0EA5E9] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                              {user.role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

{tab === "announcements" && <AdminAnnouncementsTab />}


              </>
            )}
          </div>
        </div>
      </div>

      {residentModalOpen && selectedResident && (
        <ResidentDetailsModal
          resident={selectedResident}
          activeTab={residentModalTab}
          editMode={residentEditMode}
          editPassword={residentEditPassword}
          onTabChange={setResidentModalTab}
          onSaved={async () => {
            setResidentModalOpen(false);
            setSelectedResident(null);
            setResidentEditMode(false);
            setResidentEditPassword("");
            await fetchDashboard();
          }}
          onClose={() => {
            setResidentModalOpen(false);
            setSelectedResident(null);
            setResidentEditMode(false);
            setResidentEditPassword("");
          }}
        />
      )}

      {digitalIdResident && (
        <ResidentDigitalIdModal
          resident={digitalIdResident}
          onClose={() => setDigitalIdResident(null)}
        />
      )}

      {secureModalOpen && secureResident && (
        <PasswordConfirmModal
          action={secureAction}
          password={securePassword}
          loading={secureLoading}
          error={secureError}
          onPasswordChange={setSecurePassword}
          onCancel={closeSecureModal}
          onConfirm={confirmSecureAction}
        />
      )}

      {/* Mobile bottom navigation */}
      <MobileBottomNav
        items={adminBottomNavItems}
        active={tab}
        onChange={(id) => {
          setTab(id as typeof tab);
          setMobileSidebarOpen(false);
        }}
      />
    </main>
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
  active?: boolean;
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

      <span className="leading-snug">{label}</span>
    </button>
  );
}

function IconActionButton({
  icon,
  label,
  variant = "primary",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "primary" | "warning" | "danger";
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
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition ${color}`}
    >
      {icon}
    </button>
  );
}

function PasswordConfirmModal({
  action,
  password,
  loading,
  error,
  onPasswordChange,
  onCancel,
  onConfirm,
}: {
  action: SecureAction;
  password: string;
  loading: boolean;
  error: string;
  onPasswordChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.30)]">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <KeyRound className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Enter Password
            </h2>

            <p className="text-sm text-slate-500">
              Required before you can {action === "delete" ? "delete" : "edit"} this resident.
            </p>
          </div>
        </div>

        <Input
          label="Admin Password"
          type="password"
          value={password}
          onChange={onPasswordChange}
        />

        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60 ${
              action === "delete"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#0EA5E9] hover:bg-sky-600"
            }`}
          >
            {loading ? "Checking..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-sky-200 bg-white p-3 sm:p-5 shadow-sm flex flex-col justify-between">
      <div className="mb-2 sm:mb-3 flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-sky-50 text-sky-600">
        {icon}
      </div>

      <div>
        <p className="text-[10px] sm:text-sm text-slate-500 leading-tight line-clamp-2">{label}</p>
        <p className="mt-0.5 sm:mt-2 text-xl sm:text-3xl font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function ChartCard({
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
    <div className="rounded-[24px] border border-sky-200 bg-white p-5">
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

function Input({
  label,
  value,
  onChange,
  type = "text",
  fixedSuffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  fixedSuffix?: string;
}) {
  const displayValue =
    fixedSuffix && type === "text"
      ? getBarangayHcmsUsernameLocalPart(value)
      : value;

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <div className="flex min-h-[52px] w-full items-center rounded-2xl border border-sky-200 bg-white px-4 transition focus-within:border-[#0EA5E9]">
        <input
          type={type}
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none"
        />

        {fixedSuffix && type === "text" && (
          <span className="ml-2 shrink-0 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600 ring-1 ring-sky-200">
            {fixedSuffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ReadonlyBadgeInput({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <div className="flex min-h-[52px] items-center rounded-2xl border border-sky-200 bg-[#EFF6FF] px-4">
        <span className="inline-flex rounded-full bg-[#0EA5E9] px-3 py-1 text-sm font-semibold text-white shadow-sm">
          {value}
        </span>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[52px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sky-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function ResidentDetailsModal({
  resident,
  activeTab,
  editMode,
  editPassword,
  onTabChange,
  onSaved,
  onClose,
}: {
  resident: ResidentRecord;
  activeTab: "identifying" | "medical" | "family" | "personal";
  editMode: boolean;
  editPassword: string;
  onTabChange: (
    tab: "identifying" | "medical" | "family" | "personal"
  ) => void;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const [editForm, setEditForm] = useState({
    firstName: resident.firstName ?? "",
    lastName: resident.lastName ?? "",
    middleName: resident.middleName ?? "",
    age: String(resident.age ?? ""),
    sex: resident.sex ?? "",
    birthDate: resident.birthDate ? resident.birthDate.slice(0, 10) : "",
    religion: resident.religion ?? "",
    civilStatus: resident.civilStatus ?? "",
    educationalAttainment: resident.educationalAttainment ?? "",
    occupation: resident.occupation ?? "",
    contactNumber: resident.contactNumber ?? "",
    email: resident.user?.email ?? "",
    accompanyingPerson: resident.accompanyingPerson ?? "",
    relationship: resident.relationship ?? "",
    spouseMaidenName: resident.spouseMaidenName ?? "",
    spouseOccupation: resident.spouseOccupation ?? "",
    spouseContactNumber: resident.spouseContactNumber ?? "",
    completeAddress: resident.completeAddress ?? "",
    barangayName: resident.barangayName ?? "",
    city: resident.city ?? "",
  });

  const fullName = `${editForm.firstName} ${editForm.middleName ?? ""} ${editForm.lastName}`
    .replace(/\s+/g, " ")
    .trim();

  const update = (key: keyof typeof editForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveResident = async () => {
    try {
      setSaving(true);
      setModalError("");

      const res = await fetch(`/api/residents/${resident.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: editPassword,
          ...editForm,
          age: Number(editForm.age),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setModalError(json.error || "Failed to update resident.");
        return;
      }

      onSaved();
    } catch (err) {
      console.error(err);
      setModalError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
        <div className="border-b border-slate-200 bg-gradient-to-r from-[#F8FBFF] via-white to-[#F8FBFF] px-6 py-5 sm:px-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {fullName || "Resident Details"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editMode
                  ? "Edit resident registration information"
                  : "Full resident registration information"}
              </p>
            </div>

            <div className="flex gap-2">
              {editMode && (
                <button
                  type="button"
                  onClick={saveResident}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0EA5E9] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <ModalTabButton
              active={activeTab === "identifying"}
              label="Identifying Data"
              onClick={() => onTabChange("identifying")}
            />

            <ModalTabButton
              active={activeTab === "medical"}
              label="Past Medical History"
              onClick={() => onTabChange("medical")}
            />

            <ModalTabButton
              active={activeTab === "family"}
              label="Family History"
              onClick={() => onTabChange("family")}
            />

            <ModalTabButton
              active={activeTab === "personal"}
              label="Personal / Social History"
              onClick={() => onTabChange("personal")}
            />
          </div>

          {modalError && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {modalError}
            </div>
          )}
        </div>

        <div className="max-h-[72vh] overflow-y-auto bg-sky-50 p-6 sm:p-7">
          {activeTab === "identifying" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <InfoSection
                icon={<UserRound className="h-5 w-5" />}
                title="Personal Information"
              >
                <InfoRow label="Full Name" value={fullName} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow
                    label="Age"
                    value={editForm.age}
                    editMode={editMode}
                    onChange={(v) => update("age", v)}
                  />

                  <InfoRow
                    label="Sex"
                    value={editForm.sex}
                    editMode={editMode}
                    onChange={(v) => update("sex", v)}
                  />
                </div>

                <InfoRow
                  label="Birthday"
                  value={editForm.birthDate}
                  editMode={editMode}
                  type="date"
                  onChange={(v) => update("birthDate", v)}
                />

                <InfoRow
                  label="Religion"
                  value={editForm.religion}
                  editMode={editMode}
                  onChange={(v) => update("religion", v)}
                />

                <InfoRow
                  label="Civil Status"
                  value={editForm.civilStatus}
                  editMode={editMode}
                  onChange={(v) => update("civilStatus", v)}
                />

                <InfoRow
                  label="Educational Attainment"
                  value={editForm.educationalAttainment}
                  editMode={editMode}
                  onChange={(v) => update("educationalAttainment", v)}
                />

                <InfoRow
                  label="Occupation"
                  value={editForm.occupation}
                  editMode={editMode}
                  onChange={(v) => update("occupation", v)}
                />
              </InfoSection>

              <InfoSection icon={<Phone className="h-5 w-5" />} title="Contacts">
                <InfoRow
                  label="Contact No."
                  value={editForm.contactNumber}
                  editMode={editMode}
                  onChange={(v) => update("contactNumber", v)}
                />

                <InfoRow
                  label="Email"
                  value={editForm.email}
                  editMode={editMode}
                  onChange={(v) => update("email", v)}
                />

                <InfoRow
                  label="Accompanying Person"
                  value={editForm.accompanyingPerson}
                  editMode={editMode}
                  onChange={(v) => update("accompanyingPerson", v)}
                />

                <InfoRow
                  label="Relationship"
                  value={editForm.relationship}
                  editMode={editMode}
                  onChange={(v) => update("relationship", v)}
                />

                <InfoRow
                  label="Spouse Maiden Name"
                  value={editForm.spouseMaidenName}
                  editMode={editMode}
                  onChange={(v) => update("spouseMaidenName", v)}
                />

                <InfoRow
                  label="Spouse Occupation"
                  value={editForm.spouseOccupation}
                  editMode={editMode}
                  onChange={(v) => update("spouseOccupation", v)}
                />

                <InfoRow
                  label="Spouse Contact No."
                  value={editForm.spouseContactNumber}
                  editMode={editMode}
                  onChange={(v) => update("spouseContactNumber", v)}
                />
              </InfoSection>

              <InfoSection icon={<MapPin className="h-5 w-5" />} title="Address">
  <InfoRow
    label="Street"
    value={editForm.completeAddress?.split(",")[0] || "—"}
    editMode={editMode}
    onChange={(v) => update("completeAddress", v)}
  />
                <InfoRow
                  label="Barangay"
                  value={editForm.barangayName}
                  editMode={editMode}
                  onChange={(v) => update("barangayName", v)}
                />

                <InfoRow
                  label="City"
                  value={editForm.city}
                  editMode={editMode}
                  onChange={(v) => update("city", v)}
                />
              </InfoSection>
            </div>
          )}

          {activeTab === "medical" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <InfoSection
                icon={<HeartPulse className="h-5 w-5" />}
                title="Conditions"
              >
                <InfoRow
                  label="Hypertension"
                  value={yesNo(resident.medicalHistory?.hasHypertension)}
                />
                <InfoRow
                  label="Diabetes"
                  value={yesNo(resident.medicalHistory?.hasDiabetes)}
                />
                <InfoRow
                  label="STI / HIV"
                  value={yesNo(resident.medicalHistory?.hasStiHiv)}
                />
                <InfoRow
                  label="Heart Disease"
                  value={yesNo(resident.medicalHistory?.hasHeartDisease)}
                />
                <InfoRow
                  label="Kidney Failure"
                  value={yesNo(resident.medicalHistory?.hasKidneyFailure)}
                />
                <InfoRow
                  label="Tuberculosis"
                  value={yesNo(resident.medicalHistory?.hasTuberculosis)}
                />
              </InfoSection>

              <InfoSection
                icon={<ClipboardList className="h-5 w-5" />}
                title="Details"
              >
                <InfoRow
                  label="Has Allergies"
                  value={yesNo(resident.medicalHistory?.hasAllergies)}
                />
                <InfoRow
                  label="Allergies Details"
                  value={resident.medicalHistory?.allergiesDetails}
                  multiline
                />
                <InfoRow
                  label="Has Cancer"
                  value={yesNo(resident.medicalHistory?.hasCancer)}
                />
                <InfoRow
                  label="Cancer Details"
                  value={resident.medicalHistory?.cancerDetails}
                  multiline
                />
                <InfoRow
                  label="Other Conditions"
                  value={yesNo(resident.medicalHistory?.hasOtherConditions)}
                />
                <InfoRow
                  label="Other Conditions Details"
                  value={resident.medicalHistory?.otherConditionsDetails}
                  multiline
                />
              </InfoSection>

              <InfoSection
                icon={<FileText className="h-5 w-5" />}
                title="Medication / Surgeries"
              >
                <InfoRow
                  label="Maintenance Medications"
                  value={resident.medicalHistory?.maintenanceMedications}
                  multiline
                />
                <InfoRow
                  label="Previous Illnesses / Surgeries"
                  value={resident.medicalHistory?.previousIllnessesSurgeries}
                  multiline
                />
              </InfoSection>
            </div>
          )}

          {activeTab === "family" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <InfoSection icon={<Users className="h-5 w-5" />} title="Family History">
                <InfoRow
                  label="Asthma / Allergies"
                  value={yesNo(resident.familyHistory?.asthmaAllergies)}
                />
                <InfoRow
                  label="Birth Defects"
                  value={yesNo(resident.familyHistory?.birthDefects)}
                />
                <InfoRow
                  label="Cancer"
                  value={yesNo(resident.familyHistory?.cancer)}
                />
                <InfoRow
                  label="Dementia"
                  value={yesNo(resident.familyHistory?.dementia)}
                />
                <InfoRow
                  label="Diabetes"
                  value={yesNo(resident.familyHistory?.diabetes)}
                />
                <InfoRow
                  label="Hypertension"
                  value={yesNo(resident.familyHistory?.hypertension)}
                />
                <InfoRow
                  label="Kidney Disease"
                  value={yesNo(resident.familyHistory?.kidneyDisease)}
                />
                <InfoRow
                  label="Mental Illness"
                  value={yesNo(resident.familyHistory?.mentalIllness)}
                />
              </InfoSection>
            </div>
          )}

          {activeTab === "personal" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <InfoSection
                icon={<Activity className="h-5 w-5" />}
                title="Lifestyle Information"
              >
                <InfoRow
                  label="Eats Healthy Diet"
                  value={yesNo(resident.personalSocialHistory?.eatsHealthyDiet)}
                />
                <InfoRow
                  label="Adequate Physical Activity"
                  value={yesNo(
                    resident.personalSocialHistory?.adequatePhysicalActivity
                  )}
                />
                <InfoRow
                  label="Sufficient Rest / Sleep"
                  value={yesNo(resident.personalSocialHistory?.sufficientRestSleep)}
                />
                <InfoRow
                  label="Normal Growth & Development"
                  value={yesNo(
                    resident.personalSocialHistory?.normalGrowthDevelopment
                  )}
                />
                <InfoRow
                  label="Multiple Sex Partners"
                  value={yesNo(resident.personalSocialHistory?.multipleSexPartners)}
                />
              </InfoSection>

              <InfoSection
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Risk Factors"
              >
                <InfoRow
                  label="Smokes Tobacco"
                  value={yesNo(resident.personalSocialHistory?.smokesTobacco)}
                />
                <InfoRow
                  label="Tobacco Packs / Year"
                  value={resident.personalSocialHistory?.tobaccoPacksPerYear}
                />
                <InfoRow
                  label="Drinks Alcohol"
                  value={yesNo(resident.personalSocialHistory?.drinksAlcohol)}
                />
                <InfoRow
                  label="Alcohol Bottles / Day"
                  value={resident.personalSocialHistory?.alcoholBottlesPerDay}
                />
                <InfoRow
                  label="Takes Illicit Drugs"
                  value={yesNo(resident.personalSocialHistory?.takesIllicitDrugs)}
                />
                <InfoRow
                  label="Illicit Drugs Details"
                  value={resident.personalSocialHistory?.illicitDrugsDetails}
                  multiline
                />
              </InfoSection>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ResidentDigitalIdModal({
  resident,
  onClose,
}: {
  resident: ResidentRecord;
  onClose: () => void;
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

  const fullName = `${resident.firstName || ""} ${resident.middleName || ""} ${
    resident.lastName || ""
  }`
    .replace(/\s+/g, " ")
    .trim();

  const { qrImageUrl, loading: qrLoading } = useSecureQrUrl(resident.id);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
      <div className="flex w-full max-w-[840px] flex-col items-center rounded-[30px] bg-white p-4 shadow-[0_30px_80px_rgba(15,23,42,0.30)] sm:p-6">
        <div className="mb-6 w-full flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Resident Digital ID
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 line-clamp-1">{fullName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shrink-0 ml-4"
          >
            Close
          </button>
        </div>

        <div 
          ref={cardRef}
          className="relative h-[215px] w-[340px] overflow-hidden rounded-[18px] border border-sky-200 bg-white font-sans shadow-[0_18px_45px_rgba(37,99,235,0.18)] sm:h-[316px] sm:w-[500px] sm:rounded-[24px] lg:aspect-[760/480] lg:h-auto lg:w-full lg:max-w-[760px] lg:rounded-[30px]"
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#F8FBFF_0%,#FFFFFF_42%,#EEF6FF_100%)]" />
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#0EA5E9_0%,#38BDF8_48%,#BAE6FD_100%)] sm:h-2 lg:h-2.5" />
          <div className="absolute inset-y-0 left-0 w-1.5 bg-[linear-gradient(180deg,#0EA5E9_0%,#38BDF8_55%,#BAE6FD_100%)] sm:w-2 lg:w-2.5" />
          <div className="absolute right-[-42px] top-[-60px] h-[150px] w-[150px] rounded-full border-[22px] border-sky-200/70 sm:right-[-58px] sm:top-[-82px] sm:h-[230px] sm:w-[230px] sm:border-[34px] lg:right-[-78px] lg:top-[-108px] lg:h-[320px] lg:w-[320px] lg:border-[48px]" />
          <div className="absolute bottom-[-58px] left-[70px] h-[150px] w-[150px] rounded-full border-[18px] border-emerald-100/70 sm:bottom-[-86px] sm:left-[110px] sm:h-[220px] sm:w-[220px] sm:border-[26px] lg:bottom-[-120px] lg:left-[170px] lg:h-[300px] lg:w-[300px] lg:border-[36px]" />
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
            <div className="flex items-center justify-between border-b border-sky-200/90 pb-2 sm:pb-3 lg:pb-4">
              <img
                src="/images/davao-logo.png"
                alt="Barangay logo"
                className="h-9 w-9 object-contain drop-shadow-sm sm:h-14 sm:w-14 lg:h-[74px] lg:w-[74px]"
              />
              <div className="flex-1 px-2 text-center sm:px-4">
                <p className="text-[7px] font-black leading-tight text-slate-800 sm:text-[10px] lg:text-[13px]">REPUBLIC OF THE PHILIPPINES</p>
                <p className="text-[7px] font-black leading-tight text-slate-800 sm:text-[10px] lg:text-[13px]">BARANGAY 19-B HEALTH OFFICE</p>
                <h2 className="mt-1 text-[11px] font-black uppercase tracking-wide text-[#075985] sm:text-[17px] lg:text-[25px]">BARANGAY HEALTH DIGITAL ID</h2>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-sm ring-1 ring-sky-200 sm:h-14 sm:w-14 sm:rounded-2xl lg:h-[74px] lg:w-[74px] lg:rounded-[22px]">
                <HealthLogoIcon className="h-7 w-7 sm:h-11 sm:w-11 lg:h-14 lg:w-14" />
              </div>
            </div>

            <div className="flex flex-1 gap-3 pt-3 sm:gap-5 sm:pt-5 lg:gap-8 lg:pt-6">
              <div className="flex w-[92px] shrink-0 flex-col items-center sm:w-[142px] lg:w-[205px]">
                <div className="w-full rounded-xl border border-sky-200 bg-white p-1 shadow-[0_10px_24px_rgba(15,23,42,0.12)] sm:rounded-2xl sm:p-2 lg:rounded-[24px] lg:p-3">
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
                <div className="mb-1.5 rounded-lg border border-sky-200/70 bg-white/70 px-2 py-1.5 shadow-sm backdrop-blur-sm sm:mb-2.5 sm:rounded-xl sm:px-3 sm:py-2 lg:mb-4 lg:rounded-2xl lg:px-4 lg:py-3">
                  <p className="text-[6px] font-black uppercase text-[#075985] sm:text-[8px] lg:text-[11px]">Last Name, First Name, Middle Name</p>
                  <h3 className="text-[12px] font-black uppercase leading-tight text-slate-950 sm:text-[18px] lg:text-[27px]">
                    {formatResidentIdName(resident)}
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
                    <p className="truncate text-[9px] font-black uppercase text-slate-950 sm:text-[13px] lg:text-[19px]">{formatResidentDate(resident.birthDate)}</p>
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
                  <div className="rounded-lg bg-[#075985] px-2 py-1 text-right shadow-sm sm:rounded-xl sm:px-3 sm:py-1.5 lg:rounded-2xl lg:px-4 lg:py-2">
                    <p className="text-[5px] font-black uppercase text-sky-100 sm:text-[7px] lg:text-[10px]">Agency Code</p>
                    <p className="text-[8px] font-black uppercase text-white sm:text-[11px] lg:text-[16px]">B19B</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 w-[340px] sm:w-[500px] lg:w-full lg:max-w-[760px]">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0EA5E9] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-sky-600 disabled:opacity-60 lg:py-4 lg:text-base"
          >
            {downloading ? "Saving Card Image..." : "Download Digital ID"}
          </button>
        </div>
      </div>
    </div>
  );
}

function IdBlock({ label, value }: { label: string; value: unknown }) {
  if (!hasDisplayValue(value)) return null;
  return (
    <div>
      <p className="text-sm font-bold text-sky-600">{label}</p>
      <p className="mt-1 text-base font-black uppercase text-slate-950">
        {String(value)}
      </p>
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

function formatResidentDate(date?: string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function formatResidentIdName(resident: ResidentRecord) {
  const middle = resident.middleName ? ` ${resident.middleName}` : "";
  return `${resident.lastName}, ${resident.firstName}${middle}`.trim();
}

function DashboardPieChart({
  data,
  colors = chartColors,
}: {
  data: { name: string; value: number }[];
  colors?: string[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  let currentPercent = 0;

  const gradient =
    total === 0
      ? "#E0F2FE 0% 100%"
      : data
          .map((item, index) => {
            const percent = (item.value / total) * 100;
            const start = currentPercent;
            const end = currentPercent + percent;
            currentPercent = end;

            return `${colors[index % colors.length]} ${start}% ${end}%`;
          })
          .join(", ");

  return (
    <div className="grid items-center gap-6 md:grid-cols-[220px_1fr]">
      <div className="relative mx-auto flex h-52 w-52 items-center justify-center rounded-full bg-sky-50">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${gradient})`,
          }}
        />

        <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Total</p>
          <p className="text-3xl font-black text-slate-900">{total}</p>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor: colors[index % colors.length],
                }}
              />

              <span className="text-sm font-bold text-slate-700">
                {item.name}
              </span>
            </div>

            <span className="text-lg font-black text-sky-600">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardBarChart({
  data,
}: {
  data: { name: string; total: number }[];
}) {
  const max = Math.max(...data.map((item) => item.total), 1);

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const width = Math.round((item.total / max) * 100);

        return (
          <div key={item.name}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-slate-700">{item.name}</span>
              <span className="font-black text-sky-600">{item.total}</span>
            </div>

            <div className="h-4 overflow-hidden rounded-full bg-sky-50">
              <div
                className="h-full rounded-full bg-[#0EA5E9] transition-all duration-500"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InfoSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const hasVisibleContent = hasVisibleReactContent(children);

  if (!hasVisibleContent) {
    return null;
  }

  return (
    <section className="rounded-[30px] border border-slate-200 bg-[#F8FBFF] p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-sky-200 bg-[#EAF3FF] text-sky-600 shadow-sm">
          {icon}
        </div>

        <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
          {title}
        </h3>
      </div>

      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ModalTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
        active
          ? "bg-[#0EA5E9] text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function InfoRow({
  label,
  value,
  multiline = false,
  editMode = false,
  type = "text",
  onChange,
}: {
  label: string;
  value: unknown;
  multiline?: boolean;
  editMode?: boolean;
  type?: string;
  onChange?: (value: string) => void;
}) {
  if (!editMode && !hasDisplayValue(value)) {
    return null;
  }

  const displayValue = hasDisplayValue(value) ? String(value) : "";

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>

      {editMode && onChange ? (
        multiline ? (
          <textarea
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500"
          />
        ) : (
          <input
            type={type}
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[46px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500"
          />
        )
      ) : (
        <p
          className={`font-semibold text-slate-900 ${
            multiline
              ? "whitespace-pre-wrap break-words text-[0.95rem] leading-7"
              : "text-[0.95rem] leading-7"
          }`}
        >
          {displayValue}
        </p>
      )}
    </div>
  );
}

function hasVisibleReactContent(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some((child) => {
    if (!React.isValidElement(child)) {
      return hasDisplayValue(child);
    }

    const props = child.props as {
      value?: unknown;
      editMode?: boolean;
      children?: React.ReactNode;
    };

    if (props.editMode) return true;

    if ("value" in props) {
      return hasDisplayValue(props.value);
    }

    if (props.children) {
      return hasVisibleReactContent(props.children);
    }

    return false;
  });
}

function hasDisplayValue(value: unknown) {
  if (value === null || value === undefined) return false;

  const text = String(value).trim();

  return text !== "" && text !== "—";
}

function yesNo(value?: boolean | null) {
  if (value === null || value === undefined) return null;
  return value ? "Yes" : "No";
}

type Announcement = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  publishDate: string;
  createdAt: string;
};

function AdminAnnouncementsTab() {
  const today = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);

const [form, setForm] = useState({
  title: "",
  content: "",
  imageUrl: "",
  publishDate: today,
});

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

  const handleImageUpload = (file: File | null) => {
  if (!file) return;

  setImageFile(file);

  const previewUrl = URL.createObjectURL(file);

  setForm((prev) => ({
    ...prev,
    imageUrl: previewUrl,
  }));
};

  const handlePostAnnouncement = async (e: React.FormEvent) => {
  e.preventDefault();

  setPosting(true);
  setMessage("");
  setError("");

  try {
    let finalImageUrl = "";

    
    if (imageFile) {
      const uploadData = new FormData();
      uploadData.append("file", imageFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok) {
        setError(uploadJson.error || "Failed to upload image.");
        return;
      }

      finalImageUrl = uploadJson.imageUrl;
    }


    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        imageUrl: finalImageUrl, 
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Failed to post announcement.");
      return;
    }

    
    setMessage("Announcement posted successfully.");

    // Reset form
    setForm({
      title: "",
      content: "",
      imageUrl: "",
      publishDate: today,
    });

    setImageFile(null); // 🔥 IMPORTANT

    setSelectedDate(form.publishDate);
    await fetchAnnouncements();
  } catch (err) {
    console.error(err);
    setError("Unable to connect to the server.");
  } finally {
    setPosting(false);
  }
};
  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-sky-200 bg-white p-5">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <Megaphone className="h-9 w-9 stroke-[2.8]" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Health Center Announcements
            </h2>
            <p className="text-sm text-slate-500">
              Post announcements with text, image, and scheduled date.
            </p>
          </div>
        </div>

        <form onSubmit={handlePostAnnouncement} className="space-y-5">
          <div className="grid items-stretch gap-5 lg:grid-cols-[1fr_390px]">
            <div className="flex h-full flex-col gap-4">
              <Input
                label="Announcement Title"
                value={form.title}
                onChange={(v) => setForm((p) => ({ ...p, title: v }))}
              />

              <div className="flex flex-1 flex-col">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Announcement Text
                </label>

                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, content: e.target.value }))
                  }
                  required
                  placeholder="Write the announcement details here..."
                  className="min-h-[240px] flex-1 resize-none rounded-2xl border border-sky-200 bg-white px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex h-full flex-col rounded-[24px] border border-sky-200 bg-[#F8FBFF] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0EA5E9] text-white">
                  <CalendarDays className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">Schedule Post</h3>
                  <p className="text-xs text-slate-500">
                    Choose when residents can view it.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Publish Date
                  </label>

                  <input
                    type="date"
                    value={form.publishDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, publishDate: e.target.value }))
                    }
                    required
                    className="min-h-[52px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Pubmat / Image Upload
                  </label>

                  {!form.imageUrl ? (
                    <label className="flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sky-200 bg-white px-4 py-5 text-center transition hover:border-sky-500 hover:bg-sky-50">
                      <ImageIcon className="mb-2 h-9 w-9 text-sky-600" />
                      <span className="text-sm font-bold text-slate-700">
                        Click to upload image
                      </span>
                      <span className="mt-1 text-xs text-slate-400">
                        PNG, JPG, or JPEG
                      </span>

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm">
                      <div className="relative bg-slate-100">
                        <img
                          src={form.imageUrl}
                          alt="Announcement preview"
                          className="max-h-[260px] w-full object-contain"
                        />

                        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
                          Preview
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 p-3">
                        <label className="cursor-pointer rounded-xl bg-sky-50 px-4 py-2 text-sm font-bold text-sky-600 transition hover:bg-sky-100">
                          Change
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleImageUpload(e.target.files?.[0] || null)
                            }
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            setForm((p) => ({ ...p, imageUrl: "" }))
                          }
                          className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto pt-5">
                <button
                  type="submit"
                  disabled={posting}
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0EA5E9] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600 disabled:opacity-60"
                >
                  <PlusCircle className="h-5 w-5" />
                  {posting ? "Posting..." : "Post Announcement"}
                </button>
              </div>
            </div>
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
        </form>
      </div>

      <div className="rounded-[24px] border border-sky-200 bg-white p-5">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              Announcements for {formatAnnouncementDate(selectedDate)}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Select a date to view today, past, or upcoming announcements.
            </p>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-[#EFF6FF] px-4 py-3">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Search Calendar Date
            </label>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="min-h-[46px] rounded-xl border border-sky-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 to-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-200">
              <Megaphone className="h-9 w-9 stroke-[2.8]" />
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
                  <div className="flex h-40 items-center justify-center bg-gradient-to-br from-sky-50 to-sky-100 text-sky-600">
                    <Megaphone className="h-12 w-12 stroke-[2.8]" />
                  </div>
                )}

                <div className="p-5">
                  <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600">
                    {formatAnnouncementDate(item.publishDate)}
                  </span>

                  <h4 className="mt-3 text-xl font-black text-slate-900">
                    {item.title}
                  </h4>

                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {item.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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



async function readJsonSafe(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {
      error:
        "API route returned HTML instead of JSON. Check your backend route or terminal error.",
    };
  }
}
