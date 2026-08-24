"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { InlineLoader } from "@/components/dashboard/InlineLoader";
import * as htmlToImage from "html-to-image";
import {
  Activity,
  Archive,
  ArrowLeft,
  ClipboardList,
  IdCard,
  Edit,
  Eye,
  FileText,
  HeartPulse,
  KeyRound,
  Lock,
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
import type { DiagnosisLike } from "@/lib/condition-updates";
import { ConditionHistoryCard } from "@/components/ConditionHistoryCard";
import { ActivityLogsTab } from "@/components/dashboard/ActivityLogsTab";
import { PortalLoader } from "@/components/PortalLoader";
import { HEALTH_CENTERS } from "@/lib/barangay-options";
import { DonutChart, BarList } from "@/components/dashboard/Charts";

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
  isArchived?: boolean;
  archivedAt?: string | null;
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
    id: string;
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

type SecureAction = "view" | "edit" | "digital-id" | "archive" | "delete" | null;

const sexDistributionColors = ["#075985", "#7DD3FC", "#94A3B8"];
const FALLBACK_BARANGAY_LABEL = "Assigned Barangay";

// Compact, consistent resident name: "LASTNAME JL." (last name + given initials).
function formatShortName(r: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}) {
  const initials = `${r.firstName?.[0] ?? ""}${r.middleName?.[0] ?? ""}`.toUpperCase();
  const last = (r.lastName ?? "").toUpperCase();
  return initials ? `${last} ${initials}.` : last;
}

// Formal desktop name: "LASTNAME, FIRSTNAME M." (last name first, middle as initial).
function formatTableName(r: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}) {
  const last = (r.lastName ?? "").trim();
  const first = (r.firstName ?? "").trim();
  const mid = (r.middleName ?? "").trim();
  const afterComma = `${first}${mid ? ` ${mid[0]}.` : ""}`.trim();
  return (afterComma ? `${last}, ${afterComma}` : last).toUpperCase();
}

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
  | "activity-logs"
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
  const [sitioFilter, setSitioFilter] = useState("all");
  const [staffSearch, setStaffSearch] = useState("");

  const [staffViewUser, setStaffViewUser] = useState<StaffUser | null>(null);
  const [staffEditUser, setStaffEditUser] = useState<StaffUser | null>(null);
  const [staffEditForm, setStaffEditForm] = useState({
    fullName: "",
    username: "",
    role: "BHW",
    password: "",
  });
  const [staffEditLoading, setStaffEditLoading] = useState(false);
  const [staffEditError, setStaffEditError] = useState("");

  const [staffDeleteUser, setStaffDeleteUser] = useState<StaffUser | null>(null);
  const [staffDeletePassword, setStaffDeletePassword] = useState("");
  const [staffDeleteLoading, setStaffDeleteLoading] = useState(false);
  const [staffDeleteError, setStaffDeleteError] = useState("");

  const [staffResetUser, setStaffResetUser] = useState<StaffUser | null>(null);
  const [staffResetForm, setStaffResetForm] = useState({
    newPassword: "",
    password: "",
  });
  const [staffResetLoading, setStaffResetLoading] = useState(false);
  const [staffResetError, setStaffResetError] = useState("");
  const [staffResetMessage, setStaffResetMessage] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    username: "",
    password: "",
    role: "BHW",
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Barangay switcher (super-admin can view/manage any sitio).
  const [barangays, setBarangays] = useState<{ id: string; name: string }[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedBarangayId, setSelectedBarangayId] = useState<string>("");

  const currentBarangayName =
    data?.barangay?.name ||
    adminUser?.barangay?.name ||
    FALLBACK_BARANGAY_LABEL;

  useEffect(() => {
    fetchDashboard();
    fetchAdminUser();
    (async () => {
      try {
        const res = await fetch("/api/barangays");
        if (!res.ok) return;
        const json = await res.json();
        setBarangays(json.barangays || []);
        setIsSuperAdmin(Boolean(json.isSuperAdmin));
      } catch {
        /* silent */
      }
    })();
  }, []);

  // Default the switcher to the admin's own barangay once it's known.
  useEffect(() => {
    if (adminUser?.barangay?.id && !selectedBarangayId) {
      setSelectedBarangayId(adminUser.barangay.id);
    }
  }, [adminUser?.barangay?.id, selectedBarangayId]);

  // Re-load the dashboard whenever the super-admin switches barangay.
  useEffect(() => {
    if (selectedBarangayId) fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBarangayId]);

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
      const query = selectedBarangayId
        ? `?barangayId=${encodeURIComponent(selectedBarangayId)}`
        : "";
      const res = await fetch(`/api/admin/dashboard${query}`);
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
    return [...(data?.residents ?? [])].slice(0, 10);
  }, [data]);

  const filteredResidents = useMemo(() => {
  const query = residentSearch.toLowerCase().trim();

  return (data?.residents ?? []).filter((resident) => {
    // Sitio filter (separates residents by sitio within the health center).
    if (
      sitioFilter !== "all" &&
      (resident.barangayName ?? "").toLowerCase() !== sitioFilter.toLowerCase()
    ) {
      return false;
    }

    if (!query) return true;

    const fullName = `${resident.firstName} ${resident.middleName ?? ""} ${resident.lastName}`.toLowerCase();

    return (
      fullName.includes(query) ||
      resident.sex.toLowerCase().includes(query) ||
      String(resident.age).includes(query) ||
      resident.contactNumber?.toLowerCase().includes(query)
    );
  });
}, [data, residentSearch, sitioFilter]);

  // Sitios belonging to this admin's health center, for the sitio filter.
  const centerSitios = useMemo(() => {
    const center = HEALTH_CENTERS.find((hc) => hc.name === currentBarangayName);
    if (center) return [...center.sitios];
    // Fallback: distinct sitios present in the resident list.
    return Array.from(
      new Set(
        (data?.residents ?? [])
          .map((r) => (r.barangayName ?? "").trim())
          .filter(Boolean)
      )
    );
  }, [currentBarangayName, data]);

  const filteredStaffUsers = useMemo(() => {
    const query = staffSearch.toLowerCase().trim();

    if (!query) return data?.staffUsers ?? [];

    return (data?.staffUsers ?? []).filter((user) => {
      return (
        (user.fullName ?? "").toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    });
  }, [data, staffSearch]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    try {
      setFormLoading(true);

      const fullName = `${form.firstName} ${form.middleName} ${form.lastName}`
        .replace(/\s+/g, " ")
        .trim();

      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          username: normalizeBarangayHcmsUsername(form.username),
          password: form.password,
          role: form.role,
          barangayId: selectedBarangayId,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to create user.");
        return;
      }

      setMessage("User created successfully.");

      setForm({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        username: "",
        password: "",
        role: "BHW",
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

      // For "view" and "digital-id" we just verify password then open the modal
      if (secureAction === "view" || secureAction === "digital-id") {
        const verifyRes = await fetch("/api/admin/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: securePassword }),
        });
        const verifyJson = await readJsonSafe(verifyRes);
        if (!verifyRes.ok) {
          setSecureError(verifyJson.error || "Invalid admin password.");
          return;
        }

        if (secureAction === "view") {
          setSelectedResident(secureResident);
          setResidentEditMode(false);
          setResidentEditPassword("");
          setResidentModalTab("identifying");
          setResidentModalOpen(true);
        } else {
          setDigitalIdResident(secureResident);
        }
        closeSecureModal();
        return;
      }

      if (secureAction === "edit") {
        const verifyRes = await fetch("/api/admin/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: securePassword }),
        });
        const verifyJson = await readJsonSafe(verifyRes);
        if (!verifyRes.ok) {
          setSecureError(verifyJson.error || "Invalid admin password.");
          return;
        }
        setSelectedResident(secureResident);
        setResidentEditPassword(securePassword);
        setResidentEditMode(true);
        setResidentModalTab("identifying");
        setResidentModalOpen(true);
        closeSecureModal();
        return;
      }

      if (secureAction === "archive") {
        const res = await fetch(`/api/residents/${secureResident.id}/archive`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: securePassword }),
        });
        const json = await readJsonSafe(res);
        if (!res.ok) {
          setSecureError(json.error || "Failed to archive resident.");
          return;
        }
        closeSecureModal();
        await fetchDashboard();
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

  const openStaffView = (user: StaffUser) => {
    setStaffViewUser(user);
  };

  const openStaffEdit = (user: StaffUser) => {
    setStaffEditUser(user);
    setStaffEditForm({
      fullName: user.fullName ?? "",
      username: getBarangayHcmsUsernameLocalPart(user.username),
      role: user.role,
      password: "",
    });
    setStaffEditError("");
  };

  const closeStaffEdit = () => {
    if (staffEditLoading) return;

    setStaffEditUser(null);
    setStaffEditError("");
  };

  const submitStaffEdit = async () => {
    if (!staffEditUser) return;

    if (!staffEditForm.password.trim()) {
      setStaffEditError("Admin password is required.");
      return;
    }

    try {
      setStaffEditLoading(true);
      setStaffEditError("");

      const res = await fetch(`/api/staff/${staffEditUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: staffEditForm.password,
          fullName: staffEditForm.fullName,
          username: normalizeBarangayHcmsUsername(staffEditForm.username),
          role: staffEditForm.role,
        }),
      });

      const json = await readJsonSafe(res);

      if (!res.ok) {
        setStaffEditError(json.error || "Failed to update staff user.");
        return;
      }

      closeStaffEdit();
      await fetchDashboard();
    } catch (err) {
      console.error(err);
      setStaffEditError("Unable to connect to the server.");
    } finally {
      setStaffEditLoading(false);
    }
  };

  const openStaffDelete = (user: StaffUser) => {
    setStaffDeleteUser(user);
    setStaffDeletePassword("");
    setStaffDeleteError("");
  };

  const closeStaffDelete = () => {
    if (staffDeleteLoading) return;

    setStaffDeleteUser(null);
    setStaffDeletePassword("");
    setStaffDeleteError("");
  };

  const confirmStaffDelete = async () => {
    if (!staffDeleteUser) return;

    if (!staffDeletePassword.trim()) {
      setStaffDeleteError("Admin password is required.");
      return;
    }

    try {
      setStaffDeleteLoading(true);
      setStaffDeleteError("");

      const res = await fetch(`/api/staff/${staffDeleteUser.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: staffDeletePassword,
        }),
      });

      const json = await readJsonSafe(res);

      if (!res.ok) {
        setStaffDeleteError(json.error || "Failed to delete staff user.");
        return;
      }

      closeStaffDelete();
      await fetchDashboard();
    } catch (err) {
      console.error(err);
      setStaffDeleteError("Unable to connect to the server.");
    } finally {
      setStaffDeleteLoading(false);
    }
  };

  const openStaffReset = (user: StaffUser) => {
    setStaffResetUser(user);
    setStaffResetForm({ newPassword: "", password: "" });
    setStaffResetError("");
    setStaffResetMessage("");
  };

  const closeStaffReset = () => {
    if (staffResetLoading) return;

    setStaffResetUser(null);
    setStaffResetForm({ newPassword: "", password: "" });
    setStaffResetError("");
    setStaffResetMessage("");
  };

  const submitStaffReset = async () => {
    if (!staffResetUser) return;

    if (staffResetForm.newPassword.trim().length < 8) {
      setStaffResetError("New password must be at least 8 characters.");
      return;
    }

    if (!staffResetForm.password.trim()) {
      setStaffResetError("Admin password is required.");
      return;
    }

    try {
      setStaffResetLoading(true);
      setStaffResetError("");
      setStaffResetMessage("");

      const res = await fetch(`/api/staff/${staffResetUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: staffResetForm.password,
          newPassword: staffResetForm.newPassword,
        }),
      });

      const json = await readJsonSafe(res);

      if (!res.ok) {
        setStaffResetError(json.error || "Failed to reset password.");
        return;
      }

      setStaffResetMessage("Password reset successfully.");
      setStaffResetForm({ newPassword: "", password: "" });
    } catch (err) {
      console.error(err);
      setStaffResetError("Unable to connect to the server.");
    } finally {
      setStaffResetLoading(false);
    }
  };

  const adminBottomNavItems = [
    { id: "overview",      label: "Overview",   icon: <Activity className="h-5 w-5" /> },
    { id: "residents",     label: "Residents",  icon: <Users className="h-5 w-5" /> },
    { id: "create-user",   label: "Add User",   icon: <UserPlus className="h-5 w-5" /> },
    { id: "activity-logs", label: "Activity",   icon: <ClipboardList className="h-5 w-5" /> },
    { id: "announcements", label: "News",       icon: <Megaphone className="h-5 w-5" /> },
    { id: "scan-qr",       label: "Scan QR",    icon: <ScanLine className="h-5 w-5" /> },
  ];

  return (
    <main className="page-shell">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="page-shell-inner">
        {/* Mobile sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[var(--drawer-width)] transform rounded-r-[1.875rem] border border-[#DCEAF7] bg-white/95 p-4 text-slate-800 shadow-2xl shadow-sky-900/10 transition-transform duration-300 lg:hidden ${
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
              active={tab === "activity-logs"}
              icon={<ClipboardList className="h-5 w-5 shrink-0" />}
              label="Activity Logs"
              onClick={() => {
                setTab("activity-logs");
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
        <aside className="hidden shrink-0 rounded-[1.875rem] border border-[#DCEAF7] bg-white p-4 text-slate-800 shadow-2xl shadow-sky-900/10 lg:block lg:h-full lg:w-[var(--sidebar-width)] lg:p-5 lg:overflow-y-auto [&::-webkit-scrollbar]:hidden">
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
                active={tab === "activity-logs"}
                icon={<ClipboardList className="h-5 w-5 shrink-0" />}
                label="Activity Logs"
                onClick={() => setTab("activity-logs")}
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

        <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden lg:h-full">
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

                      {isSuperAdmin && barangays.length > 0 ? (
                        <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full border border-sky-300 bg-sky-50 pl-2.5 pr-1 py-0.5 text-xs font-bold text-sky-700">
                          <MapPin className="h-3.5 w-3.5" />
                          <select
                            value={selectedBarangayId}
                            onChange={(e) => setSelectedBarangayId(e.target.value)}
                            title="Switch barangay"
                            className="max-w-[220px] cursor-pointer rounded-full bg-transparent px-1 py-1 text-xs font-bold text-sky-700 outline-none"
                          >
                            {barangays.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </span>
                      ) : (
                        <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600">
                          <MapPin className="h-3.5 w-3.5" />
                          {currentBarangayName}
                        </span>
                      )}
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
              <PortalLoader label="Loading dashboard..." inline />
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
                        <DonutChart
                          data={sexData}
                          colors={sexDistributionColors}
                        />

                      </ChartCard>

                      <ChartCard
                        icon={<Users className="h-5 w-5" />}
                        title="Age Group Distribution"
                        subtitle="Resident population by age group"
                      >
                        <BarList data={ageGroupData} />
                      </ChartCard>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                      <ChartCard
                        icon={<Activity className="h-5 w-5" />}
                        title="Recent Registered Residents"
                        subtitle="Latest verified resident accounts"
                      >
                        <div className="max-h-[330px] space-y-3 overflow-y-auto pr-1">
                          {recentResidents.map((resident) => (
                            <div
                              key={resident.id}
                              className="flex items-center justify-between gap-3 rounded-2xl bg-sky-50 p-4"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">
                                  {formatShortName(resident)}
                                </p>

                                <p className="truncate text-sm text-slate-500">
                                  {resident.barangayName} • {resident.age} years
                                  old
                                </p>
                              </div>

                              <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
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
                        <BarList data={roleData} />
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

                {tab === "activity-logs" && (
                  <ActivityLogsTab barangayId={selectedBarangayId} />
                )}

                {tab === "residents" && (
                  <div className="rounded-[24px] border border-sky-200 bg-white p-3 sm:p-5">
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

  {/* RIGHT SIDE — sitio filter + search */}
  <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl lg:justify-end">
    {centerSitios.length > 1 && (
      <div className="relative w-full sm:max-w-[220px]">
        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <select
          value={sitioFilter}
          onChange={(e) => setSitioFilter(e.target.value)}
          className="min-h-[52px] w-full appearance-none rounded-2xl border border-sky-200 bg-sky-50 pl-12 pr-8 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
        >
          <option value="all">All Sitios</option>
          {centerSitios.map((sitio) => (
            <option key={sitio} value={sitio}>
              {sitio}
            </option>
          ))}
        </select>
      </div>
    )}

    <div className="relative w-full sm:max-w-sm">
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
</div>
                    {/* Mobile compact list - Name + Actions on one line */}
          <div className="md:hidden">
            <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Resident Name
            </div>

            <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
            {filteredResidents.length === 0 && (
              <div className="rounded-2xl bg-sky-50 px-4 py-6 text-center text-sm text-slate-500">
                No resident found.
              </div>
            )}

            {filteredResidents.map((resident) => (
              <div
                key={resident.id}
                className="flex items-center justify-between gap-2 rounded-2xl bg-sky-50 px-2.5 py-2.5 shadow-sm"
              >
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
                  {formatShortName(resident)}
                </p>

                <div className="flex shrink-0 items-center gap-0.5">
                  <IconActionButton
                    label="View"
                    dense
                    icon={<Eye className="h-3.5 w-3.5" />}
                    onClick={() => openSecureModal(resident, "view")}
                  />
                  <IconActionButton
                    label="Digital ID"
                    dense
                    icon={<IdCard className="h-3.5 w-3.5" />}
                    onClick={() => openSecureModal(resident, "digital-id")}
                  />
                  <IconActionButton
                    label="Edit"
                    dense
                    icon={<Edit className="h-3.5 w-3.5" />}
                    variant="warning"
                    onClick={() => openSecureModal(resident, "edit")}
                  />
                  <IconActionButton
                    label={resident.isArchived ? "Unarchive" : "Archive"}
                    dense
                    icon={<Archive className="h-3.5 w-3.5" />}
                    variant="danger"
                    onClick={() => openSecureModal(resident, "archive")}
                  />
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Desktop full table */}
                    <div className="hidden overflow-x-auto md:block">
  <table className="min-w-full w-full table-fixed border-separate border-spacing-y-2">
    <thead>
      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
        <th className="w-[44%] px-3">Resident Name</th>
        <th className="w-[12%] px-3">Sex</th>
        <th className="w-[10%] px-3">Age</th>
        <th className="w-[20%] px-3">Contact</th>
        <th className="w-[14%] px-3 text-center">Actions</th>
      </tr>
    </thead>
    <tbody>
    {filteredResidents.length === 0 && (
  <tr>
    <td colSpan={5} className="rounded-2xl bg-sky-50 px-4 py-6 text-center text-sm text-slate-500">
      No resident found.
    </td>
  </tr>
)}
      {filteredResidents.map((resident) => (
        <tr key={resident.id} className="bg-sky-50 shadow-sm">
          <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">
            <span className="block truncate whitespace-nowrap">
              {formatTableName(resident)}
            </span>
          </td>
          <td className="px-3 py-3 text-sm text-slate-600">{resident.sex}</td>
          <td className="px-3 py-3 text-sm text-slate-600">{resident.age}</td>
          <td className="px-3 py-3 text-sm text-slate-600">{resident.contactNumber || "\u2014"}</td>
          <td className="rounded-r-2xl px-3 py-3">
            <div className="flex items-center justify-center gap-2">
              <IconActionButton label="View Details" icon={<Eye className="h-4 w-4" />} onClick={() => openSecureModal(resident, "view")} />
              <IconActionButton label="Digital ID" icon={<IdCard className="h-4 w-4" />} onClick={() => openSecureModal(resident, "digital-id")} />
              <IconActionButton label="Edit Resident" icon={<Edit className="h-4 w-4" />} variant="warning" onClick={() => openSecureModal(resident, "edit")} />
              <IconActionButton label={resident.isArchived ? "Unarchive" : "Archive"} icon={<Archive className="h-4 w-4" />} variant="danger" onClick={() => openSecureModal(resident, "archive")} />
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

                      <form onSubmit={handleCreateUser} className="space-y-5">
                        {/* Full name — first / middle / last */}
                        <div>
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Full Name
                          </p>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <Input
                              label="First Name"
                              value={form.firstName}
                              onChange={(v) =>
                                setForm((p) => ({ ...p, firstName: v }))
                              }
                            />
                            <Input
                              label="Middle Name (Optional)"
                              value={form.middleName}
                              onChange={(v) =>
                                setForm((p) => ({ ...p, middleName: v }))
                              }
                            />
                            <Input
                              label="Last Name"
                              value={form.lastName}
                              onChange={(v) =>
                                setForm((p) => ({ ...p, lastName: v }))
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Input
                            label="Email"
                            type="email"
                            value={form.email}
                            onChange={(v) =>
                              setForm((p) => ({ ...p, email: v }))
                            }
                          />

                          <Input
                            label="Phone Number"
                            value={form.phoneNumber}
                            onChange={(v) =>
                              setForm((p) => ({ ...p, phoneNumber: v }))
                            }
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                          <Input
                            label="Password"
                            type="password"
                            value={form.password}
                            onChange={(v) =>
                              setForm((p) => ({ ...p, password: v }))
                            }
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Select
                            label="Role"
                            value={form.role}
                            onChange={(v) => setForm((p) => ({ ...p, role: v }))}
                            options={["DOCTOR", "BHW", "NURSE", "MIDWIFE", "PHARMACIST", "MEDTECH", "NUTRITIONIST"]}
                          />

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
                  <div className="rounded-[24px] border border-sky-200 bg-white p-3 sm:p-5">
                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* LEFT SIDE */}
                      <div className="flex items-center gap-3">
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

                      {/* RIGHT SIDE SEARCH */}
                      <div className="relative w-full lg:max-w-sm">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                        <input
                          type="text"
                          value={staffSearch}
                          onChange={(e) => setStaffSearch(e.target.value)}
                          placeholder="Search name, username, role..."
                          className="min-h-[52px] w-full rounded-2xl border border-sky-200 bg-sky-50 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Mobile compact list - Name + Actions on one line */}
                    <div className="space-y-2 md:hidden">
                      <div className="px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Staff Name
                      </div>

                      {filteredStaffUsers.length === 0 && (
                        <div className="rounded-2xl bg-sky-50 px-4 py-6 text-center text-sm text-slate-500">
                          No staff user found.
                        </div>
                      )}

                      {filteredStaffUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between gap-2 rounded-2xl bg-sky-50 px-2.5 py-2.5 shadow-sm"
                        >
                          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
                            {user.fullName || user.username}
                          </p>

                          <div className="flex shrink-0 items-center gap-0.5">
                            <IconActionButton
                              label="View"
                              dense
                              icon={<Eye className="h-3.5 w-3.5" />}
                              onClick={() => openStaffView(user)}
                            />
                            <IconActionButton
                              label="Edit"
                              dense
                              icon={<Edit className="h-3.5 w-3.5" />}
                              variant="warning"
                              onClick={() => openStaffEdit(user)}
                            />
                            <IconActionButton
                              label="Reset Password"
                              dense
                              icon={<KeyRound className="h-3.5 w-3.5" />}
                              onClick={() => openStaffReset(user)}
                            />
                            <IconActionButton
                              label="Delete"
                              dense
                              icon={<Trash2 className="h-3.5 w-3.5" />}
                              variant="danger"
                              onClick={() => openStaffDelete(user)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop full table */}
                    <div className="hidden overflow-x-auto md:block">
                      <table className="min-w-full w-full table-fixed border-separate border-spacing-y-2">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                            <th className="w-[34%] px-3">Name</th>
                            <th className="w-[28%] px-3">Username</th>
                            <th className="w-[18%] px-3">Role</th>
                            <th className="w-[20%] px-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStaffUsers.length === 0 && (
                            <tr>
                              <td colSpan={4} className="rounded-2xl bg-sky-50 px-4 py-6 text-center text-sm text-slate-500">
                                No staff user found.
                              </td>
                            </tr>
                          )}
                          {filteredStaffUsers.map((user) => (
                            <tr key={user.id} className="bg-sky-50 shadow-sm">
                              <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">
                                <span className="block truncate whitespace-nowrap">
                                  {user.fullName || "—"}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-sm text-slate-600">
                                <span className="block truncate whitespace-nowrap">
                                  {user.username}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className="inline-flex rounded-full bg-[#0EA5E9] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                                  {user.role}
                                </span>
                              </td>
                              <td className="rounded-r-2xl px-3 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <IconActionButton label="View Details" icon={<Eye className="h-4 w-4" />} onClick={() => openStaffView(user)} />
                                  <IconActionButton label="Edit Staff User" icon={<Edit className="h-4 w-4" />} variant="warning" onClick={() => openStaffEdit(user)} />
                                  <IconActionButton label="Reset Password" icon={<KeyRound className="h-4 w-4" />} onClick={() => openStaffReset(user)} />
                                  <IconActionButton label="Delete Staff User" icon={<Trash2 className="h-4 w-4" />} variant="danger" onClick={() => openStaffDelete(user)} />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

{tab === "announcements" && <AdminAnnouncementsTab barangayId={selectedBarangayId} />}


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

      {staffViewUser && (
        <StaffViewModal
          user={staffViewUser}
          barangayName={currentBarangayName}
          onClose={() => setStaffViewUser(null)}
        />
      )}

      {staffEditUser && (
        <StaffEditModal
          form={staffEditForm}
          loading={staffEditLoading}
          error={staffEditError}
          onChange={(next) => setStaffEditForm((p) => ({ ...p, ...next }))}
          onCancel={closeStaffEdit}
          onSubmit={submitStaffEdit}
        />
      )}

      {staffDeleteUser && (
        <PasswordConfirmModal
          action="delete"
          subjectLabel="this staff user"
          password={staffDeletePassword}
          loading={staffDeleteLoading}
          error={staffDeleteError}
          onPasswordChange={setStaffDeletePassword}
          onCancel={closeStaffDelete}
          onConfirm={confirmStaffDelete}
        />
      )}

      {staffResetUser && (
        <StaffResetPasswordModal
          userLabel={staffResetUser.fullName || staffResetUser.username}
          form={staffResetForm}
          loading={staffResetLoading}
          error={staffResetError}
          message={staffResetMessage}
          onChange={(next) => setStaffResetForm((p) => ({ ...p, ...next }))}
          onCancel={closeStaffReset}
          onSubmit={submitStaffReset}
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

function PasswordConfirmModal({
  action,
  subjectLabel = "this resident",
  password,
  loading,
  error,
  onPasswordChange,
  onCancel,
  onConfirm,
}: {
  action: SecureAction;
  subjectLabel?: string;
  password: string;
  loading: boolean;
  error: string;
  onPasswordChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const meta: Record<
    NonNullable<SecureAction>,
    { title: string; desc: string; iconBg: string; iconColor: string; btnClass: string; btnLabel: string }
  > = {
    view: {
      title: "View Resident",
      desc: `Enter your admin password to view ${subjectLabel}.`,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
      btnClass: "bg-[#0EA5E9] hover:bg-sky-600",
      btnLabel: "View",
    },
    edit: {
      title: "Edit Resident",
      desc: `Enter your admin password to edit ${subjectLabel}.`,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      btnClass: "bg-amber-500 hover:bg-amber-600",
      btnLabel: "Edit",
    },
    "digital-id": {
      title: "View Digital ID",
      desc: `Enter your admin password to view the Digital ID of ${subjectLabel}.`,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
      btnClass: "bg-[#0EA5E9] hover:bg-sky-600",
      btnLabel: "View ID",
    },
    archive: {
      title: "Archive Resident",
      desc: `Enter your admin password to archive ${subjectLabel}.`,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      btnClass: "bg-red-600 hover:bg-red-700",
      btnLabel: "Archive",
    },
    delete: {
      title: "Delete",
      desc: `Enter your admin password to permanently delete ${subjectLabel}.`,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      btnClass: "bg-red-600 hover:bg-red-700",
      btnLabel: "Delete",
    },
  };

  const m = action ? meta[action] : null;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[28px] border border-sky-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex flex-col items-center text-center">
          <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${m?.iconBg ?? "bg-sky-50"} ${m?.iconColor ?? "text-sky-600"}`}>
            <Lock className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Confirm your password</h3>
          <p className="mt-1 text-sm text-slate-500">{m?.desc}</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) onConfirm();
          }}
          className="space-y-3"
        >
          <div className="flex min-h-[52px] items-center rounded-2xl border border-sky-200 bg-white px-4 transition focus-within:border-[#0EA5E9]">
            <Lock className="mr-3 h-5 w-5 shrink-0 text-slate-400" />
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Your password"
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="min-h-[48px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`min-h-[48px] flex-1 rounded-2xl px-4 text-sm font-bold text-white transition disabled:opacity-60 ${m?.btnClass ?? "bg-[#0EA5E9] hover:bg-sky-600"}`}
            >
              {loading ? "Verifying…" : (m?.btnLabel ?? "Unlock")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function StaffViewModal({
  user,
  barangayName,
  onClose,
}: {
  user: StaffUser;
  barangayName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.30)]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <UserRound className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {user.fullName || user.username}
              </h2>

              <p className="text-sm text-slate-500">Staff user details</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl bg-sky-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Username</p>
            <p className="text-sm font-semibold text-slate-900">{user.username}</p>
          </div>

          <div className="rounded-2xl bg-sky-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Role</p>
            <span className="mt-1 inline-flex rounded-full bg-[#0EA5E9] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
              {user.role}
            </span>
          </div>

          <div className="rounded-2xl bg-sky-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Barangay</p>
            <p className="text-sm font-semibold text-slate-900">{user.barangay?.name || barangayName}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-[#0EA5E9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffEditModal({
  form,
  loading,
  error,
  onChange,
  onCancel,
  onSubmit,
}: {
  form: { fullName: string; username: string; role: string; password: string };
  loading: boolean;
  error: string;
  onChange: (next: Partial<{ fullName: string; username: string; role: string; password: string }>) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.30)]">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <Edit className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Edit Staff User</h2>
            <p className="text-sm text-slate-500">Update account details and confirm with your admin password.</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Full Name"
            value={form.fullName}
            onChange={(v) => onChange({ fullName: v })}
          />

          <Input
            label="Username"
            value={form.username}
            onChange={(v) => onChange({ username: normalizeBarangayHcmsUsername(v) })}
            fixedSuffix={BARANGAY_ADMIN_USERNAME_SUFFIX}
          />

          <Select
            label="Role"
            value={form.role}
            onChange={(v) => onChange({ role: v })}
            options={["DOCTOR", "BHW", "NURSE", "MIDWIFE", "PHARMACIST", "MEDTECH", "NUTRITIONIST"]}
          />

          <Input
            label="Admin Password"
            type="password"
            value={form.password}
            onChange={(v) => onChange({ password: v })}
          />
        </div>

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
            onClick={onSubmit}
            disabled={loading}
            className="rounded-2xl bg-[#0EA5E9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffResetPasswordModal({
  userLabel,
  form,
  loading,
  error,
  message,
  onChange,
  onCancel,
  onSubmit,
}: {
  userLabel: string;
  form: { newPassword: string; password: string };
  loading: boolean;
  error: string;
  message: string;
  onChange: (next: Partial<{ newPassword: string; password: string }>) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.30)]">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <KeyRound className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
            <p className="text-sm text-slate-500">
              Set a new password for{" "}
              <span className="font-semibold text-slate-700">{userLabel}</span>.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={form.newPassword}
            onChange={(v) => onChange({ newPassword: v })}
          />

          <Input
            label="Admin Password"
            type="password"
            value={form.password}
            onChange={(v) => onChange({ password: v })}
          />
        </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {message ? "Close" : "Cancel"}
          </button>

          {!message && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={loading}
              className="rounded-2xl bg-[#0EA5E9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          )}
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
    <div className="min-w-0 overflow-hidden rounded-[24px] border border-sky-200 bg-white p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h3>
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

  // Medical history tab — live data
  type AppointmentEntry = {
    id: string;
    date: string;
    time: string;
    reason: string;
    otherReason?: string | null;
    suggestion?: string | null;
    status: string;
    doctor?: { fullName?: string | null } | null;
  };
  type BmiEntry = {
    id: string;
    height: number;
    weight: number;
    bmi: number;
    bmiCategory: string;
    pulseRate: number;
    createdAt: string;
  };
  const [medAppointments, setMedAppointments] = useState<AppointmentEntry[]>([]);
  const [medBmi, setMedBmi] = useState<BmiEntry[]>([]);
  const [medLoading, setMedLoading] = useState(false);
  const [medError, setMedError] = useState("");
  const [medDiagnoses, setMedDiagnoses] = useState<DiagnosisLike[]>([]);

  useEffect(() => {
    if (activeTab !== "medical") return;
    let cancelled = false;
    const load = async () => {
      try {
        setMedLoading(true);
        setMedError("");
        const [apptRes, bmiRes, dxRes] = await Promise.all([
          fetch(`/api/residents/${resident.id}/appointments`),
          fetch(`/api/residents/${resident.id}/bmi`),
          fetch(`/api/residents/${resident.id}/diagnoses`),
        ]);
        const [apptJson, bmiJson, dxJson] = await Promise.all([
          apptRes.json(),
          bmiRes.json(),
          dxRes.json(),
        ]);
        if (!cancelled) {
          setMedAppointments(Array.isArray(apptJson) ? apptJson : []);
          setMedBmi(Array.isArray(bmiJson) ? bmiJson : []);
          setMedDiagnoses(Array.isArray(dxJson) ? dxJson : []);
        }
      } catch {
        if (!cancelled) setMedError("Failed to load medical data.");
      } finally {
        if (!cancelled) setMedLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeTab, resident.id]);

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
                {fullName || "Resident Details"}
              </h2>
              <p className="truncate text-xs text-slate-500 sm:text-sm">
                {editMode
                  ? "Edit resident registration information"
                  : "Full resident registration information"}
              </p>
            </div>

            {editMode && (
              <button
                type="button"
                onClick={saveResident}
                disabled={saving}
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#0EA5E9] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">{saving ? "Saving..." : "Save"}</span>
              </button>
            )}
          </div>

          {/* One-line icon tab strip */}
          <div className="mt-4 flex items-stretch gap-1 rounded-2xl bg-sky-50 p-1">
            {[
              { id: "identifying", label: "Identity", icon: <IdCard className="h-5 w-5" /> },
              { id: "medical", label: "Medical", icon: <HeartPulse className="h-5 w-5" /> },
              { id: "family", label: "Family", icon: <Users className="h-5 w-5" /> },
              { id: "personal", label: "Personal", icon: <ClipboardList className="h-5 w-5" /> },
            ].map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTabChange(t.id as typeof activeTab)}
                  aria-label={t.label}
                  className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition ${
                    active
                      ? "bg-[#0EA5E9] text-white shadow-sm"
                      : "text-slate-500 hover:bg-white"
                  }`}
                >
                  {t.icon}
                  <span className="max-w-full truncate leading-none">{t.label}</span>
                </button>
              );
            })}
          </div>

          {modalError && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {modalError}
            </div>
          )}
        </div>

        <div className="max-h-[72vh] overflow-y-auto bg-sky-50 p-4 sm:p-7">
          {activeTab === "identifying" && (
            <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
              <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
                <ModalCleanGroup title="Personal Details" icon={<UserRound className="h-4 w-4" />}>
                  <ModalCleanField label="Full Name" value={fullName} />
                  <ModalCleanField label="Age" value={editForm.age} editMode={editMode} type="number" onChange={(v) => update("age", v)} />
                  <ModalCleanField label="Sex" value={editForm.sex} editMode={editMode} options={["MALE", "FEMALE"]} onChange={(v) => update("sex", v)} />
                  <ModalCleanField label="Birthday" value={editForm.birthDate} editMode={editMode} type="date" onChange={(v) => update("birthDate", v)} />
                  <ModalCleanField label="Civil Status" value={editForm.civilStatus} editMode={editMode} onChange={(v) => update("civilStatus", v)} />
                  <ModalCleanField label="Religion" value={editForm.religion} editMode={editMode} onChange={(v) => update("religion", v)} />
                  <ModalCleanField label="Education" value={editForm.educationalAttainment} editMode={editMode} onChange={(v) => update("educationalAttainment", v)} />
                  <ModalCleanField label="Occupation" value={editForm.occupation} editMode={editMode} onChange={(v) => update("occupation", v)} />
                </ModalCleanGroup>

                <div className="space-y-8">
                  <ModalCleanGroup title="Contact & Family" icon={<Phone className="h-4 w-4" />}>
                    <ModalCleanField label="Contact No." value={editForm.contactNumber} editMode={editMode} onChange={(v) => update("contactNumber", v)} />
                    <ModalCleanField label="Email" value={editForm.email} editMode={editMode} onChange={(v) => update("email", v)} />
                    <ModalCleanField label="Accompanying Person" value={editForm.accompanyingPerson} editMode={editMode} onChange={(v) => update("accompanyingPerson", v)} />
                    <ModalCleanField label="Relationship" value={editForm.relationship} editMode={editMode} onChange={(v) => update("relationship", v)} />
                    <ModalCleanField label="Spouse Maiden Name" value={editForm.spouseMaidenName} editMode={editMode} onChange={(v) => update("spouseMaidenName", v)} />
                    <ModalCleanField label="Spouse Occupation" value={editForm.spouseOccupation} editMode={editMode} onChange={(v) => update("spouseOccupation", v)} />
                    <ModalCleanField label="Spouse Contact No." value={editForm.spouseContactNumber} editMode={editMode} onChange={(v) => update("spouseContactNumber", v)} />
                  </ModalCleanGroup>

                  <ModalCleanGroup title="Address" icon={<MapPin className="h-4 w-4" />}>
                    <ModalCleanField label="Street" value={editForm.completeAddress?.split(",")[0] || ""} editMode={editMode} onChange={(v) => update("completeAddress", v)} />
                    <ModalCleanField label="Barangay" value={editForm.barangayName} editMode={editMode} onChange={(v) => update("barangayName", v)} />
                    <ModalCleanField label="City" value={editForm.city} editMode={editMode} onChange={(v) => update("city", v)} />
                    <ModalCleanField label="Province" value="Davao del Norte" />
                  </ModalCleanGroup>
                </div>
              </div>
            </div>
          )}

          {activeTab === "medical" && (
            <div className="space-y-6">
              {medLoading && (
                <InlineLoader label="Loading medical history…" />
              )}
              {medError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {medError}
                </div>
              )}

              {/* Condition flags */}
              <InfoSection icon={<HeartPulse className="h-5 w-5" />} title="Recorded Conditions" alwaysShow>
                <ConditionHistoryCard
                  medicalHistory={resident.medicalHistory ?? null}
                  diagnoses={medDiagnoses}
                  residentName={`${resident.firstName ?? ""} ${resident.lastName ?? ""}`
                    .replace(/\s+/g, " ")
                    .trim()}
                />
                <div className="mt-3 space-y-2">
                  <InfoRow label="Allergies Details" value={resident.medicalHistory?.allergiesDetails} multiline />
                  <InfoRow label="Cancer Details" value={resident.medicalHistory?.cancerDetails} multiline />
                  <InfoRow label="Other Conditions Details" value={resident.medicalHistory?.otherConditionsDetails} multiline />
                  <InfoRow label="Maintenance Medications" value={resident.medicalHistory?.maintenanceMedications} multiline />
                  <InfoRow label="Previous Illnesses / Surgeries" value={resident.medicalHistory?.previousIllnessesSurgeries} multiline />
                </div>
              </InfoSection>

              {/* BMI Records */}
              <InfoSection icon={<Activity className="h-5 w-5" />} title={`BMI Records (${medBmi.length})`}>
                {medBmi.length === 0 && !medLoading ? (
                  <p className="text-sm text-slate-400">No BMI records found.</p>
                ) : (
                  <div className="space-y-2">
                    {medBmi.map((r) => (
                      <div key={r.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-black text-slate-900">{r.bmiCategory}</span>
                          <span className="text-xs font-bold text-slate-500">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          BMI: {r.bmi.toFixed(1)} · Height: {r.height} cm · Weight: {r.weight} kg · Pulse: {r.pulseRate} bpm
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </InfoSection>

              {/* Appointment history */}
              <InfoSection icon={<ClipboardList className="h-5 w-5" />} title={`Appointment History (${medAppointments.length})`}>
                {medAppointments.length === 0 && !medLoading ? (
                  <p className="text-sm text-slate-400">No appointments recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {medAppointments.map((appt) => (
                      <div key={appt.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-black text-slate-900">
                            {new Date(appt.date).toLocaleDateString()} · {appt.time}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                            appt.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700"
                              : appt.status === "CANCELLED"
                              ? "bg-red-50 text-red-600"
                              : "bg-sky-50 text-sky-600"
                          }`}>
                            {appt.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {appt.reason}{appt.otherReason ? ` — ${appt.otherReason}` : ""}
                          {appt.doctor?.fullName ? ` · Dr. ${appt.doctor.fullName}` : ""}
                        </p>
                        {appt.suggestion && (
                          <p className="mt-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                            Suggestion: {appt.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </InfoSection>
            </div>
          )}

          {activeTab === "family" && (
            <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
              {resident.familyHistory ? (
                <ModalFlagGroup
                  title="Hereditary Conditions"
                  icon={<Users className="h-4 w-4" />}
                  tone="bad"
                  columns={2}
                  items={[
                    { label: "Asthma / Allergies", value: resident.familyHistory.asthmaAllergies },
                    { label: "Birth Defects", value: resident.familyHistory.birthDefects },
                    { label: "Cancer", value: resident.familyHistory.cancer },
                    { label: "Dementia", value: resident.familyHistory.dementia },
                    { label: "Diabetes", value: resident.familyHistory.diabetes },
                    { label: "Hypertension", value: resident.familyHistory.hypertension },
                    { label: "Kidney Disease", value: resident.familyHistory.kidneyDisease },
                    { label: "Mental Illness", value: resident.familyHistory.mentalIllness },
                  ]}
                />
              ) : (
                <p className="text-sm font-semibold text-slate-400">
                  No family history recorded.
                </p>
              )}
            </div>
          )}

          {activeTab === "personal" && (
            <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
              {resident.personalSocialHistory ? (
                <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
                  <ModalFlagGroup
                    title="Healthy Lifestyle"
                    icon={<Activity className="h-4 w-4" />}
                    tone="good"
                    items={[
                      { label: "Eats Healthy Diet", value: resident.personalSocialHistory.eatsHealthyDiet },
                      { label: "Adequate Physical Activity", value: resident.personalSocialHistory.adequatePhysicalActivity },
                      { label: "Sufficient Rest / Sleep", value: resident.personalSocialHistory.sufficientRestSleep },
                      { label: "Normal Growth & Development", value: resident.personalSocialHistory.normalGrowthDevelopment },
                      { label: "Multiple Sex Partners", value: resident.personalSocialHistory.multipleSexPartners, tone: "bad" },
                    ]}
                  />

                  <ModalFlagGroup
                    title="Risk Factors"
                    icon={<ShieldCheck className="h-4 w-4" />}
                    tone="bad"
                    items={[
                      { label: "Smokes Tobacco", value: resident.personalSocialHistory.smokesTobacco },
                      { label: "Tobacco Packs / Year", value: resident.personalSocialHistory.tobaccoPacksPerYear },
                      { label: "Drinks Alcohol", value: resident.personalSocialHistory.drinksAlcohol },
                      { label: "Alcohol Bottles / Day", value: resident.personalSocialHistory.alcoholBottlesPerDay },
                      { label: "Takes Illicit Drugs", value: resident.personalSocialHistory.takesIllicitDrugs },
                      { label: "Illicit Drugs Details", value: resident.personalSocialHistory.illicitDrugsDetails },
                    ]}
                  />
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-400">
                  No personal / social history recorded.
                </p>
              )}
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
      <div className="flex w-full max-w-[min(100%,52.5rem)] flex-col items-center rounded-[1.875rem] bg-white p-4 shadow-[0_1.875rem_5rem_rgba(15,23,42,0.30)] sm:p-6">
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
          className="relative aspect-[340/215] w-full max-w-[min(100%,47.5rem)] overflow-hidden rounded-[1.125rem] border border-sky-200 bg-white font-sans shadow-[0_1.125rem_2.8rem_rgba(37,99,235,0.18)] sm:rounded-[1.5rem] lg:rounded-[1.875rem]"
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
                <p className="text-[7px] font-black leading-tight text-slate-800 sm:text-[10px] lg:text-[13px]">{(resident.barangayName || "Barangay").toUpperCase()} HEALTH OFFICE</p>
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

        <div className="mt-6 w-full max-w-[min(100%,47.5rem)]">
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

function ModalCleanGroup({
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
        <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
          {title}
        </h4>
      </div>
      <dl className="divide-y divide-slate-100">{children}</dl>
    </div>
  );
}

function ModalCleanField({
  label,
  value,
  editMode = false,
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
  if (editMode && onChange) {
    return (
      <div className="py-3">
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </label>
        {options ? (
          <select
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
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
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[42px] w-full rounded-xl border border-sky-200 bg-white px-3 text-[15px] font-semibold text-slate-900 outline-none focus:border-sky-500"
          />
        )}
      </div>
    );
  }

  if (!hasDisplayValue(value)) return null;

  return (
    <div className="flex items-baseline justify-between gap-6 py-3">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className="break-words text-right text-sm font-bold text-slate-900">
        {String(value)}
      </span>
    </div>
  );
}

function ModalFlagGroup({
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
    typeof item.value === "boolean" ? true : hasDisplayValue(item.value)
  );

  if (visible.length === 0) {
    return (
      <p className="text-sm font-semibold text-slate-400">
        No records in this section.
      </p>
    );
  }

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

function InfoSection({
  icon,
  title,
  children,
  alwaysShow = false,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  alwaysShow?: boolean;
}) {
  const hasVisibleContent = alwaysShow || hasVisibleReactContent(children);

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

type Announcement = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  publishDate: string;
  createdAt: string;
};

function AdminAnnouncementsTab({ barangayId }: { barangayId?: string }) {
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

      const bq = barangayId ? `&barangayId=${encodeURIComponent(barangayId)}` : "";
      const res = await fetch(`/api/admin/announcements?date=${selectedDate}${bq}`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, barangayId]);

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
        barangayId,
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
          <InlineLoader label="Loading announcements..." />
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
