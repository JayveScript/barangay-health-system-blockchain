"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalLoader } from "@/components/PortalLoader";
import { InlineLoader } from "@/components/dashboard/InlineLoader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ProgressBar } from "@/components/dashboard/Charts";
import { ResidentStatsOverview } from "@/components/dashboard/ResidentStatsOverview";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  Home,
  LogOut,
  MapPin,
  Menu,
  Megaphone,
  Plus,
  BookOpen,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  ScanLine,
  X,
} from "lucide-react";

type BHWUser = {
  id: string;
  fullName: string;
  username: string;
  role: "BHW";
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

export default function BHWDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "personal" | "announcements" | "scan-qr" | "logbook" | "bmi">(
    "overview"
  );
  const [user, setUser] = useState<BHWUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();

        if (!res.ok || data.role !== "BHW") {
          window.location.href = "/login";
          return;
        }

        setUser(data);
      } catch (error) {
        console.error("BHW_DASHBOARD_ERROR", error);
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const initials = useMemo(() => {
    if (!user?.fullName) return "BH";
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
    return <PortalLoader label="Loading BHW dashboard..." />;
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
                <p className="text-xs text-slate-500">BHW Dashboard</p>
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
                <p className="text-sm text-slate-500">BHW Dashboard</p>
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
                        BHW
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

            {activeTab === "personal" && (
              <PersonalInfoTab user={user} initials={initials} />
            )}

            {activeTab === "scan-qr" && (
              <div className="rounded-[24px] border border-sky-200 bg-white p-5">
                <QrScannerTab />
              </div>
            )}

            {activeTab === "announcements" && <BHWAnnouncementsTab />}

            {activeTab === "logbook" && <LogbookTab />}

            {activeTab === "bmi" && <BMITab />}
          </div>
        </section>
      </div>

      <MobileBottomNav
        items={[
          { id: "overview", label: "Overview", icon: <Activity className="h-5 w-5" /> },
          { id: "personal", label: "Profile", icon: <UserRound className="h-5 w-5" /> },
          { id: "announcements", label: "News", icon: <Megaphone className="h-5 w-5" /> },
          { id: "scan-qr", label: "Scan QR", icon: <ScanLine className="h-5 w-5" /> },
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
  return <ResidentStatsOverview />;
}

function PersonalInfoTab({
  user,
  initials,
}: {
  user: BHWUser;
  initials: string;
}) {
  return (
    <div className="space-y-5 pb-4">
      <ProfileInfoPanel
        fullName={user.fullName}
        initials={initials}
        roleLabel="Barangay Health Worker"
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

type Announcement = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  publishDate: string;
  createdAt?: string;
};

function BHWAnnouncementsTab() {
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
          <InlineLoader label="Loading announcements..." />
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

function LogbookTab() {
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
      {/* Header Panel */}
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
          <InlineLoader label="Loading logbook entries..." />
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
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
        active
          ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
          : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
      }`}
    >
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

