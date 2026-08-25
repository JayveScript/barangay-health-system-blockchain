"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalLoader } from "@/components/PortalLoader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ResidentStatsOverview } from "@/components/dashboard/ResidentStatsOverview";
import { ReferralsTab } from "@/components/dashboard/ReferralsTab";
import {
  Activity,
  Baby,
  HeartPulse,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Scale,
  Send,
  ShieldCheck,
  Stethoscope,
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
import { BMITab } from "@/components/dashboard/BMITab";
import { DiagnoseTab } from "@/components/dashboard/DiagnoseTab";
import { AnnouncementsManager } from "@/components/dashboard/AnnouncementsManager";
import { MaternalRecordsTab } from "@/components/dashboard/MaternalRecordsTab";
import { RegisteredResidentsTab } from "@/components/dashboard/RegisteredResidentsTab";

export default function NurseDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "personal" | "residents" | "announcements" | "maternal" | "referrals" | "scan-qr" | "bmi" | "diagnose">(
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
    return <PortalLoader label="Loading Nurse dashboard..." />;
  }

  if (!user) return null;

  const currentBarangayName = user.barangay?.name || "Assigned Barangay";

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
              active={activeTab === "residents"}
              icon={<Users className="h-5 w-5" />}
              label="Registered Residents"
              onClick={() => {
                setActiveTab("residents");
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
              active={activeTab === "bmi"}
              icon={<Scale className="h-5 w-5" />}
              label="BMI Records"
              onClick={() => {
                setActiveTab("bmi");
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
              active={activeTab === "maternal"}
              icon={<Baby className="h-5 w-5" />}
              label="Maternal Records"
              onClick={() => {
                setActiveTab("maternal");
                setMobileSidebarOpen(false);
              }}
            />
          </div>
        </aside>

        <aside className="hidden h-full w-[240px] shrink-0 rounded-[30px] border border-[#DCEAF7] bg-white p-5 text-slate-800 shadow-2xl shadow-sky-900/10 lg:flex lg:flex-col">
          <div className="flex min-h-0 flex-1 flex-col rounded-[24px] border border-sky-200 bg-sky-50/60 p-5">
            <div className="mb-6 flex shrink-0 items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Health Portal</h2>
                <p className="text-sm text-slate-500">Nurse Dashboard</p>
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
                active={activeTab === "announcements"}
                icon={<Megaphone className="h-6 w-6" />}
                label="Announcements"
                onClick={() => setActiveTab("announcements")}
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
                active={activeTab === "bmi"}
                icon={<Scale className="h-5 w-5" />}
                label="BMI Records"
                onClick={() => setActiveTab("bmi")}
              />
              <SidebarButton
                active={activeTab === "diagnose"}
                icon={<Stethoscope className="h-5 w-5" />}
                label="Diagnose Patient"
                onClick={() => setActiveTab("diagnose")}
              />
              <SidebarButton
                active={activeTab === "maternal"}
                icon={<Baby className="h-5 w-5" />}
                label="Maternal Records"
                onClick={() => setActiveTab("maternal")}
              />
            </div>
          </div>
        </aside>

        <section className="h-full flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto [transform:translateZ(0)] [will-change:transform] [backface-visibility:hidden] rounded-[30px] border border-[#DCEAF7] bg-white p-6 shadow-2xl shadow-sky-900/10">
            <div className="mb-6 overflow-hidden rounded-[24px] border border-sky-200 bg-gradient-to-br from-white to-sky-50 p-5 shadow-lg shadow-sky-900/5">
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

            {activeTab === "announcements" && (
              <AnnouncementsManager subtitle="Post and view announcements for your barangay." />
            )}

            {activeTab === "referrals" && <ReferralsTab />}

            {activeTab === "scan-qr" && (
              <div className="rounded-[24px] border border-sky-200 bg-white p-5">
                <QrScannerTab />
              </div>
            )}

            {activeTab === "personal" && (
              <PersonalInfoTab user={user} initials={initials} />
            )}

            {activeTab === "bmi" && <BMITab />}

            {activeTab === "diagnose" && <DiagnoseTab />}

            {activeTab === "residents" && <RegisteredResidentsTab />}

            {activeTab === "maternal" && <MaternalRecordsTab />}
          </div>
        </section>
      </div>

      <MobileBottomNav
        items={[
          { id: "overview", label: "Overview", icon: <Activity className="h-5 w-5" /> },
          { id: "announcements", label: "News", icon: <Megaphone className="h-6 w-6" /> },
          { id: "referrals", label: "Referrals", icon: <Send className="h-5 w-5" /> },
          { id: "scan-qr", label: "Scan QR", icon: <ScanLine className="h-5 w-5" /> },
          { id: "maternal", label: "Maternal", icon: <Baby className="h-5 w-5" /> },
          { id: "bmi", label: "BMI", icon: <Scale className="h-5 w-5" /> },
          { id: "diagnose", label: "Diagnose", icon: <Stethoscope className="h-5 w-5" /> },
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
      <span className="flex h-6 w-6 shrink-0 items-center justify-center">{icon}</span>
      {label}
    </button>
  );
}

