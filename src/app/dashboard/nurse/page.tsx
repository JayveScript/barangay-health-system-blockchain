"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  LogOut,
  MapPin,
  Menu,
  Pill,
  ShieldCheck,
  Syringe,
  UserRound,
  Users,
  ScanLine,
  X,
} from "lucide-react";

type NurseUser = {
  id: string;
  fullName: string;
  username: string;
  role: "NURSE";
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

export default function NurseDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "personal" | "scan-qr">(
    "overview"
  );
  const [user, setUser] = useState<NurseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();

        if (!res.ok || data.role !== "NURSE") {
          window.location.href = "/login";
          return;
        }

        setUser(data);
      } catch (error) {
        console.error("NURSE_DASHBOARD_ERROR", error);
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const initials = useMemo(() => {
    if (!user?.fullName) return "NU";
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
    return (
      <main className="h-screen overflow-hidden bg-[#EFF6FF] p-6">
        <div className="mx-auto max-w-7xl rounded-[30px] border border-[#DCEAF7] bg-white p-8 shadow-2xl shadow-sky-900/10">
          <p className="text-sm text-slate-500">Loading Nurse dashboard...</p>
        </div>
      </main>
    );
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
                <p className="text-xs text-slate-500">Nurse Dashboard</p>
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

        {/* Desktop sidebar */}
        <aside className="hidden h-full w-[240px] shrink-0 rounded-[30px] border border-[#DCEAF7] bg-white p-5 text-slate-800 shadow-2xl shadow-sky-900/10 lg:block">
          <div className="rounded-[24px] border border-sky-200 bg-sky-50/60 p-5">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Health Portal</h2>
                <p className="text-sm text-slate-500">Nurse Dashboard</p>
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
                active={activeTab === "scan-qr"}
                icon={<ScanLine className="h-5 w-5" />}
                label="Scan QR"
                onClick={() => setActiveTab("scan-qr")}
              />
            </div>
          </div>
        </aside>

        <section className="h-full flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto rounded-[30px] border border-[#DCEAF7] bg-white p-6 shadow-2xl shadow-sky-900/10">
            <div className="sticky top-0 z-10 mb-6 rounded-[24px] border border-sky-200 bg-gradient-to-br from-white to-sky-50 p-5 shadow-lg shadow-sky-900/5 backdrop-blur">
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
                        NURSE
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
          { id: "personal", label: "Profile", icon: <UserRound className="h-5 w-5" /> },
          { id: "scan-qr", label: "Scan QR", icon: <ScanLine className="h-5 w-5" /> },
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
          label="Patients Assisted"
          value="72"
        />
        <MetricCard
          icon={<Syringe className="h-5 w-5" />}
          label="Immunization Support"
          value="19"
        />
        <MetricCard
          icon={<Pill className="h-5 w-5" />}
          label="Medicine Records"
          value="43"
        />
        <MetricCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Follow-ups"
          value="16"
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Panel
          icon={<BarChart3 className="h-5 w-5" />}
          title="Nursing Activity"
          subtitle="Monthly nursing support overview"
        >
          <div className="space-y-5">
            <ProgressBar label="Patient Assistance" value={84} />
            <ProgressBar label="Vital Signs Recording" value={78} />
            <ProgressBar label="Medicine Distribution" value={63} />
            <ProgressBar label="Follow-up Coordination" value={54} />
          </div>
        </Panel>

        <Panel
          icon={<Activity className="h-5 w-5" />}
          title="Nurse Service Analytics"
          subtitle="Current health center workload summary"
        >
          <div className="grid items-start gap-4 md:grid-cols-2">
            <MiniStat label="Pending Tasks" value="11" />
            <MiniStat label="Completed Tasks" value="38" />
            <MiniStat label="Priority Patients" value="6" />
            <MiniStat label="Updated Records" value="52" />
          </div>
        </Panel>
      </div>

      <Panel
        icon={<HeartPulse className="h-5 w-5" />}
        title="Health Center Nursing Summary"
        subtitle="Assigned barangay nursing service overview"
      >
        <div className="grid items-start gap-4 md:grid-cols-4">
          <SummaryBox title="Vitals Recorded" value="64" />
          <SummaryBox title="Medicine Logs" value="43" />
          <SummaryBox title="Assisted Consults" value="29" />
          <SummaryBox title="Reports Prepared" value="10" />
        </div>
      </Panel>
    </div>
  );
}

function PersonalInfoTab({
  user,
  initials,
}: {
  user: NurseUser;
  initials: string;
}) {
  return (
    <div className="space-y-5 pb-4">
      <ProfileInfoPanel
        fullName={user.fullName}
        initials={initials}
        roleLabel="Nurse"
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
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
        active
          ? "bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25"
          : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
      }`}
    >
      {icon}
      {label}
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

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-sky-600">{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-sky-50">
        <div
          className="h-full rounded-full bg-[#0EA5E9]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-[#EFF6FF] p-5">
      <p className="text-xs font-semibold uppe