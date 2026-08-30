"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalLoader } from "@/components/PortalLoader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import {
  Activity,
  Baby,
  BarChart3,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  LogOut,
  Menu,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  ScanLine,
  X,
} from "lucide-react";

type MidwifeUser = {
  id: string;
  fullName: string;
  username: string;
  role: "MIDWIFE";
  email?: string | null;
  phoneNumber?: string | null;
  isVerified: boolean;
  barangay?: {
    name: string;
  } | null;
  createdAt: string;
};

import { QrScannerTab } from "@/components/QrScannerTab";
import { MaternalRecordsTab } from "@/components/dashboard/MaternalRecordsTab";
import { RegisteredResidentsTab } from "@/components/dashboard/RegisteredResidentsTab";
import { DiagnoseTab } from "@/components/dashboard/DiagnoseTab";
import { ChangePasswordTab } from "@/components/dashboard/ChangePasswordTab";
import { KeyRound } from "lucide-react";

export default function MidwifeDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "personal" | "residents" | "maternal" | "scan-qr" | "diagnose" | "change-password">(
    "overview"
  );
  const [user, setUser] = useState<MidwifeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();

        if (!res.ok || data.role !== "MIDWIFE") {
          window.location.href = "/login";
          return;
        }

        setUser(data);
      } catch (error) {
        console.error("MIDWIFE_DASHBOARD_ERROR", error);
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const initials = useMemo(() => {
    if (!user?.fullName) return "MW";
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
    return <PortalLoader label="Loading Midwife dashboard..." />;
  }

  if (!user) return null;

  return (
    <main className="h-screen overflow-hidden bg-[#EFF6FF] p-4 sm:p-6 lg:pb-6">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="mx-auto flex h-full max-w-7xl gap-6 overflow-hidden">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[280px] transform rounded-r-[28px] bg-gradient-to-b from-[#0F172A] to-[#1E3A8A] p-4 text-white shadow-xl transition-transform duration-300 lg:hidden ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Health Portal</h2>
                <p className="text-xs text-white/70">Midwife Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"
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
              active={activeTab === "residents"}
              icon={<Users className="h-5 w-5" />}
              label="Registered Residents"
              onClick={() => {
                setActiveTab("residents");
                setMobileSidebarOpen(false);
              }}
            />
            <SidebarButton
              active={activeTab === "maternal"}
              icon={<Baby className="h-5 w-5" />}
              label="Maternal Records"
              onClick={() => {
                setActiveTab("maternal");
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
              active={activeTab === "diagnose"}
              icon={<Stethoscope className="h-5 w-5" />}
              label="Diagnose Patient"
              onClick={() => {
                setActiveTab("diagnose");
                setMobileSidebarOpen(false);
              }}
            />
            <SidebarButton
              active={activeTab === "change-password"}
              icon={<KeyRound className="h-5 w-5" />}
              label="Change Password"
              onClick={() => {
                setActiveTab("change-password");
                setMobileSidebarOpen(false);
              }}
            />
          </div>
        </aside>

        <aside className="hidden h-full w-[240px] shrink-0 rounded-[28px] bg-gradient-to-b from-[#0F172A] to-[#1E3A8A] p-5 text-white shadow-xl lg:flex lg:flex-col">
          <div className="flex min-h-0 flex-1 flex-col rounded-[26px] border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="mb-6 flex shrink-0 items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Health Portal</h2>
                <p className="text-sm text-white/70">Midwife Dashboard</p>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden">
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
                active={activeTab === "residents"}
                icon={<Users className="h-5 w-5" />}
                label="Registered Residents"
                onClick={() => setActiveTab("residents")}
              />
              <SidebarButton
                active={activeTab === "maternal"}
                icon={<Baby className="h-5 w-5" />}
                label="Maternal Records"
                onClick={() => setActiveTab("maternal")}
              />
              <SidebarButton
                active={activeTab === "scan-qr"}
                icon={<ScanLine className="h-5 w-5" />}
                label="Scan QR"
                onClick={() => setActiveTab("scan-qr")}
              />
              <SidebarButton
                active={activeTab === "diagnose"}
                icon={<Stethoscope className="h-5 w-5" />}
                label="Diagnose Patient"
                onClick={() => setActiveTab("diagnose")}
              />
              <SidebarButton
                active={activeTab === "change-password"}
                icon={<KeyRound className="h-5 w-5" />}
                label="Change Password"
                onClick={() => setActiveTab("change-password")}
              />
            </div>
          </div>
        </aside>

        <section className="h-full flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto [transform:translateZ(0)] [will-change:transform] [backface-visibility:hidden] rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-6 overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-[#F8FAFC] p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="lg:hidden flex h-11 w-11 items-center justify-center rounded-xl bg-[#2563EB] text-white hover:bg-blue-700"
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#DBEAFE] text-2xl font-extrabold text-[#2563EB]">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <h1 className="max-w-full whitespace-nowrap text-lg font-extrabold text-slate-900 sm:text-3xl">
                        Dashboard
                      </h1>

                      <span className="w-fit shrink-0 rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold text-white">
                        MIDWIFE
                      </span>

                      {user.isVerified && (
                        <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified Account
                        </span>
                      )}
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

            {activeTab === "maternal" && <MaternalRecordsTab />}

            {activeTab === "scan-qr" && (
              <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5">
                <QrScannerTab />
              </div>
            )}

            {activeTab === "diagnose" && <DiagnoseTab />}
            {activeTab === "change-password" && <ChangePasswordTab />}

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
          { id: "residents", label: "Residents", icon: <Users className="h-5 w-5" /> },
          { id: "maternal", label: "Maternal", icon: <Baby className="h-5 w-5" /> },
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
          label="Mothers Monitored"
          value="28"
        />
        <MetricCard
          icon={<Baby className="h-5 w-5" />}
          label="Newborn Records"
          value="12"
        />
        <MetricCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Prenatal Follow-ups"
          value="17"
        />
        <MetricCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Scheduled Visits"
          value="9"
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Panel
          icon={<BarChart3 className="h-5 w-5" />}
          title="Maternal Health Activity"
          subtitle="Monthly midwife service progress"
        >
          <div className="space-y-5">
            <ProgressBar label="Prenatal Monitoring" value={86} />
            <ProgressBar label="Postnatal Follow-ups" value={72} />
            <ProgressBar label="Newborn Record Updates" value={68} />
            <ProgressBar label="Family Planning Support" value={55} />
          </div>
        </Panel>

        <Panel
          icon={<Activity className="h-5 w-5" />}
          title="Midwife Service Analytics"
          subtitle="Current maternal health workload summary"
        >
          <div className="grid items-start gap-4 md:grid-cols-2">
            <MiniStat label="High-Risk Cases" value="4" />
            <MiniStat label="Pending Visits" value="9" />
            <MiniStat label="Completed Checkups" value="31" />
            <MiniStat label="Updated Records" value="44" />
          </div>
        </Panel>
      </div>

      <Panel
        icon={<HeartPulse className="h-5 w-5" />}
        title="Maternal Health Summary"
        subtitle="Barangay midwife monitoring overview"
      >
        <div className="grid items-start gap-4 md:grid-cols-4">
          <SummaryBox title="Pregnant Residents" value="7" />
          <SummaryBox title="Postpartum Mothers" value="6" />
          <SummaryBox title="Infant Follow-ups" value="12" />
          <SummaryBox title="Reports Prepared" value="8" />
        </div>
      </Panel>
    </div>
  );
}

function PersonalInfoTab({
  user,
  initials,
}: {
  user: MidwifeUser;
  initials: string;
}) {
  return (
    <div className="space-y-5 pb-4">
      <Panel
        icon={<UserRound className="h-5 w-5" />}
        title="Personal Information"
        subtitle="Your midwife account details"
      >
        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2563EB] text-2xl font-extrabold text-white">
            {initials}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{user.fullName}</h3>
            <p className="text-sm text-slate-500">Midwife</p>
          </div>
        </div>

        <div className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InfoBox label="Full Name" value={user.fullName} />
          <InfoBox label="Username" value={user.username} />
          <InfoBox label="Role" value={user.role} />
          <InfoBox label="Email" value={user.email || "Not set"} />
          <InfoBox label="Phone Number" value={user.phoneNumber || "Not set"} />
          <InfoBox
            label="Barangay"
            value={user.barangay?.name || "Assigned Barangay"}
          />
          <InfoBox
            label="Verification Status"
            value={user.isVerified ? "Verified" : "Pending"}
          />
          <InfoBox
            label="Account Created"
            value={new Date(user.createdAt).toLocaleDateString()}
          />
        </div>
      </Panel>
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
          ? "bg-[#2563EB] text-white shadow-lg shadow-blue-900/20"
          : "text-white/80 hover:bg-white/10"
      }`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center">{icon}</span>
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
    <div className="rounded-xl sm:rounded-[24px] border border-[#E5E7EB] bg-white p-2 sm:p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
      <div className="mb-2 sm:mb-4 flex h-6 w-6 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-2xl bg-[#DBEAFE] text-[#2563EB]">
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
    <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DBEAFE] text-[#2563EB]">
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
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-semibold text-slate-700">{label}</span>
        <span className="shrink-0 font-bold text-[#2563EB]">{value}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-[#DBEAFE]">
        <div
          className="h-full rounded-full bg-[#2563EB]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold text-[#2563EB]">{value}</p>
    </div>
  );
}

function SummaryBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#BFDBFE] bg-gradient-to-br from-white to-[#EFF6FF] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-4 shadow-sm">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
