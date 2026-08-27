"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PortalLoader } from "@/components/PortalLoader";
import { InlineLoader } from "@/components/dashboard/InlineLoader";
import {
  BARANGAY_ADMIN_USERNAME_SUFFIX,
  normalizeBarangayHcmsUsername,
} from "@/lib/username-validation";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  KeyRound,
  Link2,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";

type SummaryBarangay = {
  id: string;
  name: string;
  municipality?: string | null;
  residents: number;
  staff: number;
  verified: number;
  admin: { id: string; username: string; fullName?: string | null; email?: string | null } | null;
};

type Summary = {
  totals: { barangays: number; residents: number; staff: number; admins: number };
  barangays: SummaryBarangay[];
};

type SuperResident = {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  age: number;
  sex: string;
  contactNumber?: string | null;
  barangayName: string;
  user?: { isVerified?: boolean } | null;
};

type SuperStaff = {
  id: string;
  fullName?: string | null;
  username: string;
  role: string;
  barangay?: { name?: string | null } | null;
};

type Me = {
  fullName?: string | null;
  username: string;
  role: string;
  isVerified: boolean;
};

type Tab = "overview" | "residents" | "staff" | "admins";

export default function SuperAdminDashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) setMe(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const initials = useMemo(() => {
    const n = me?.fullName?.trim() || "Super Admin";
    return n.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "SA";
  }, [me?.fullName]);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  if (loading) return <PortalLoader label="Loading super admin console..." />;

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Activity className="h-5 w-5" /> },
    { id: "residents", label: "Residents", icon: <Users className="h-5 w-5" /> },
    { id: "staff", label: "Staff", icon: <Stethoscope className="h-5 w-5" /> },
    { id: "admins", label: "Barangay Admins", icon: <ShieldCheck className="h-5 w-5" /> },
  ];

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#EFF6FF] px-4 py-4 md:px-8 md:py-6 lg:px-10 lg:pb-6">
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      <div className="mx-auto h-full max-w-7xl">
        <div className="grid h-full gap-6 lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[280px] transform rounded-r-[30px] border border-[#DCEAF7] bg-white/95 p-4 shadow-2xl transition-transform duration-300 lg:hidden ${
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <SidebarInner
              tab={tab}
              navItems={navItems}
              onPick={(id) => {
                setTab(id);
                setMobileSidebarOpen(false);
              }}
              onClose={() => setMobileSidebarOpen(false)}
              mobile
            />
          </aside>

          <aside className="hidden rounded-[30px] border border-[#DCEAF7] bg-white p-5 shadow-2xl shadow-sky-900/10 lg:block lg:h-full lg:overflow-y-auto">
            <SidebarInner tab={tab} navItems={navItems} onPick={setTab} />
          </aside>

          <section className="h-full overflow-y-auto rounded-[30px] border border-[#DCEAF7] bg-white p-4 shadow-2xl shadow-sky-900/10 md:p-6">
            <div className="mb-6 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0369A1] via-[#1D4ED8] to-[#4338CA] p-5 text-white shadow-lg sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="lg:hidden flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/30"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl font-black ring-1 ring-white/30">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-black tracking-tight sm:text-2xl">
                        {me?.fullName || "Super Admin"}
                      </h1>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold ring-1 ring-white/30">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Super Admin
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-sky-100">
                      System-wide control across all barangays
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/30 transition hover:bg-white/25 md:self-center"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </div>

            {tab === "overview" && <OverviewTab />}
            {tab === "residents" && <ResidentsTab />}
            {tab === "staff" && <StaffTab />}
            {tab === "admins" && <AdminsTab />}
          </section>
        </div>
      </div>

      <MobileBottomNav
        items={navItems}
        active={tab}
        onChange={(id) => setTab(id as Tab)}
      />
    </main>
  );
}

function SidebarInner({
  tab,
  navItems,
  onPick,
  onClose,
  mobile,
}: {
  tab: Tab;
  navItems: { id: Tab; label: string; icon: React.ReactNode }[];
  onPick: (id: Tab) => void;
  onClose?: () => void;
  mobile?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-sky-200 bg-sky-50/60 p-5">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1D4ED8] to-[#4338CA] text-white shadow-lg">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">System Control</h2>
            <p className="text-xs text-slate-500">Super Admin</p>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-sky-200">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(item.id)}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-semibold transition ${
              tab === item.id
                ? "bg-gradient-to-br from-[#1D4ED8] to-[#4338CA] text-white shadow-lg shadow-blue-500/25"
                : "text-slate-600 hover:bg-white hover:text-blue-700"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function OverviewTab() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/superadmin/summary");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to load summary.");
          return;
        }
        setData(json);
      } catch {
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <InlineLoader label="Loading system overview..." />;
  }
  if (error) {
    return <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>;
  }
  if (!data) return null;

  return (
    <div className="space-y-5 pb-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 [&>*]:min-w-0">
        <StatCard icon={<Building2 className="h-5 w-5" />} label="Barangays" value={data.totals.barangays} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Residents" value={data.totals.residents} />
        <StatCard icon={<Stethoscope className="h-5 w-5" />} label="Total Staff" value={data.totals.staff} />
        <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="Barangay Admins" value={data.totals.admins} />
      </div>

      <div className="rounded-[24px] border border-sky-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-blue-700">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">Per-Barangay Breakdown</h3>
            <p className="text-sm text-slate-500">Residents, staff, and the assigned admin for each sitio.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {data.barangays.map((b) => (
            <div key={b.id} className="rounded-[20px] border border-slate-100 bg-gradient-to-br from-white to-sky-50/50 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-black text-slate-900">{b.name}</h4>
                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                    {b.admin ? b.admin.username : "No admin assigned"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                  {b.municipality || "—"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <MiniStat label="Residents" value={b.residents} />
                <MiniStat label="Verified" value={b.verified} />
                <MiniStat label="Staff" value={b.staff} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResidentsTab() {
  const [rows, setRows] = useState<SuperResident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [barangay, setBarangay] = useState("ALL");
  const [verifyTarget, setVerifyTarget] = useState<SuperResident | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/superadmin/residents");
        const json = await res.json();
        if (res.ok) setRows(json.residents || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const barangayOptions = useMemo(
    () => [...new Set(rows.map((r) => r.barangayName).filter(Boolean))].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (barangay !== "ALL" && r.barangayName !== barangay) return false;
      if (!q) return true;
      return `${r.firstName} ${r.lastName} ${r.barangayName}`
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, barangay]);

  return (
    <TableCard
      title="Registered Residents"
      subtitle="Filter residents by a specific sitio, or view all barangays."
      icon={<Users className="h-5 w-5" />}
      search={search}
      onSearch={setSearch}
      count={filtered.length}
      filterControl={
        <BarangayFilter value={barangay} onChange={setBarangay} options={barangayOptions} />
      }
    >
      {loading ? (
        <LoadingRow text="Loading residents..." />
      ) : filtered.length === 0 ? (
        <EmptyRow text="No residents found." />
      ) : (
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Age / Sex</th>
              <th className="px-3 py-2">Barangay</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2 text-center">Verified</th>
              <th className="px-3 py-2 text-center">Blockchain</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-sky-50/40">
                <td className="px-3 py-3 font-bold text-slate-900">
                  {`${r.firstName} ${r.middleName ?? ""} ${r.lastName}`.replace(/\s+/g, " ").trim()}
                </td>
                <td className="px-3 py-3 text-slate-600">{r.age} / {r.sex}</td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">{r.barangayName}</span>
                </td>
                <td className="px-3 py-3 text-slate-600">{r.contactNumber || "—"}</td>
                <td className="px-3 py-3 text-center">
                  {r.user?.isVerified ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">Yes</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">No</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => setVerifyTarget(r)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-100"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verify
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {verifyTarget && (
        <BlockchainVerifyModal
          resident={verifyTarget}
          onClose={() => setVerifyTarget(null)}
        />
      )}
    </TableCard>
  );
}

type VerifyResult = {
  recordType: string;
  label: string;
  status: "verified" | "changed" | "not_anchored" | "disabled" | "error";
  onChainHash?: string;
  currentHash?: string;
  anchoredAt?: string | null;
};

function BlockchainVerifyModal({
  resident,
  onClose,
}: {
  resident: SuperResident;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [results, setResults] = useState<VerifyResult[]>([]);
  const [enabled, setEnabled] = useState(true);

  const residentName = `${resident.firstName} ${resident.middleName ?? ""} ${resident.lastName}`
    .replace(/\s+/g, " ")
    .trim();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/blockchain/verify-resident", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ residentId: resident.id }),
        });
        const json = await res.json();
        if (!active) return;
        if (!res.ok) {
          setError(json.error || "Verification failed.");
          return;
        }
        setEnabled(json.enabled !== false);
        setResults(Array.isArray(json.results) ? json.results : []);
      } catch {
        if (active) setError("Unable to reach the verification service.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [resident.id]);

  const anyChanged = results.some((r) => r.status === "changed");
  const allVerified =
    results.length > 0 && results.every((r) => r.status === "verified");

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-sky-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
              <Link2 className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-black text-slate-900">Blockchain Verification</h3>
              <p className="text-xs font-semibold text-slate-500">{residentName}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-3 py-8 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
            <p className="text-sm font-semibold">Checking each record against the blockchain…</p>
          </div>
        ) : error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        ) : !enabled ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-700">
            Blockchain is currently turned OFF (BLOCKCHAIN_ENABLED=false), so records cannot be verified right now. Turn it back on to run verification.
          </div>
        ) : (
          <>
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-black ${
                anyChanged
                  ? "border-red-200 bg-red-50 text-red-700"
                  : allVerified
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {anyChanged
                ? "⚠ Tampering detected — a record no longer matches its blockchain seal."
                : allVerified
                ? "✓ All records match the blockchain — untampered."
                : "Some records are not sealed on the blockchain yet."}
            </div>

            <div className="mt-4 space-y-2.5">
              {results.map((r) => (
                <div key={r.recordType} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-900">{r.label}</p>
                    <VerifyBadge status={r.status} />
                  </div>
                  {r.anchoredAt && (
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">
                      Sealed: {new Date(r.anchoredAt).toLocaleString()}
                    </p>
                  )}
                  {r.onChainHash && r.status !== "not_anchored" && (
                    <p className="mt-1 break-all font-mono text-[10px] text-slate-400">
                      chain: {r.onChainHash.slice(0, 22)}…
                      {r.status === "changed" && r.currentHash && (
                        <>
                          <br />now: {r.currentHash.slice(0, 22)}…
                        </>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-[11px] font-semibold leading-relaxed text-slate-400">
          Each record was sealed on the blockchain at registration. Verification re-hashes the current database record and compares it to the on-chain seal — if anyone altered the data, the hashes won&apos;t match.
        </p>
      </div>
    </div>
  );
}

function VerifyBadge({ status }: { status: VerifyResult["status"] }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
      </span>
    );
  }
  if (status === "changed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-700 ring-1 ring-red-200">
        <AlertTriangle className="h-3.5 w-3.5" /> Changed
      </span>
    );
  }
  if (status === "not_anchored") {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500 ring-1 ring-slate-200">
        Not sealed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-600 ring-1 ring-amber-200">
      {status === "disabled" ? "Disabled" : "Error"}
    </span>
  );
}

function StaffTab() {
  const [rows, setRows] = useState<SuperStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [barangay, setBarangay] = useState("ALL");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/superadmin/staff");
        const json = await res.json();
        if (res.ok) setRows(json.staff || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const barangayOptions = useMemo(
    () =>
      [
        ...new Set(
          rows.map((s) => s.barangay?.name).filter((n): n is string => !!n)
        ),
      ].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((s) => {
      if (barangay !== "ALL" && s.barangay?.name !== barangay) return false;
      if (!q) return true;
      return `${s.fullName ?? ""} ${s.username} ${s.role} ${s.barangay?.name ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, barangay]);

  return (
    <TableCard
      title="Health Center Staff"
      subtitle="Filter staff by a specific sitio, or view all barangays."
      icon={<Stethoscope className="h-5 w-5" />}
      search={search}
      onSearch={setSearch}
      count={filtered.length}
      filterControl={
        <BarangayFilter value={barangay} onChange={setBarangay} options={barangayOptions} />
      }
    >
      {loading ? (
        <LoadingRow text="Loading staff..." />
      ) : filtered.length === 0 ? (
        <EmptyRow text="No staff found." />
      ) : (
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Username</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Barangay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-sky-50/40">
                <td className="px-3 py-3 font-bold text-slate-900">{s.fullName || "—"}</td>
                <td className="px-3 py-3 text-slate-600">{s.username}</td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase text-blue-700">{s.role}</span>
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">{s.barangay?.name || "—"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TableCard>
  );
}

function AdminsTab() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [resetFor, setResetFor] = useState<{ id: string; username: string } | null>(null);

  const [form, setForm] = useState({
    barangayName: "",
    municipality: "Davao City",
    username: "",
    password: "",
    fullName: "",
    email: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/superadmin/summary");
      const json = await res.json();
      if (res.ok) setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!form.barangayName.trim() || !form.username.trim() || form.password.length < 8) {
      setError("Barangay name, username, and an 8+ character password are required.");
      return;
    }
    try {
      setCreating(true);
      const res = await fetch("/api/admin/barangay-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barangayName: form.barangayName.trim(),
          municipality: form.municipality.trim() || null,
          username: normalizeBarangayHcmsUsername(form.username),
          password: form.password,
          fullName: form.fullName.trim() || null,
          email: form.email.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to create barangay admin.");
        return;
      }
      setMessage(`Created ${form.barangayName} with admin ${normalizeBarangayHcmsUsername(form.username)}.`);
      setForm({ barangayName: "", municipality: "Davao City", username: "", password: "", fullName: "", email: "" });
      await load();
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5 pb-4">
      <div className="rounded-[24px] border border-sky-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">Create Barangay Admin</h3>
            <p className="text-sm text-slate-500">Adds a new barangay and its admin account.</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Barangay Name" value={form.barangayName} onChange={(v) => setForm((p) => ({ ...p, barangayName: v }))} />
            <Field label="Municipality" value={form.municipality} onChange={(v) => setForm((p) => ({ ...p, municipality: v }))} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label={`Username (ends with ${BARANGAY_ADMIN_USERNAME_SUFFIX})`}
              value={form.username}
              onChange={(v) => setForm((p) => ({ ...p, username: normalizeBarangayHcmsUsername(v) }))}
            />
            <Field label="Password" type="password" value={form.password} onChange={(v) => setForm((p) => ({ ...p, password: v }))} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full Name (optional)" value={form.fullName} onChange={(v) => setForm((p) => ({ ...p, fullName: v }))} />
            <Field label="Email (optional)" type="email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} />
          </div>

          {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}
          {message && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>}

          <button
            type="submit"
            disabled={creating}
            className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#1D4ED8] to-[#4338CA] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:opacity-95 disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {creating ? "Creating..." : "Create Barangay + Admin"}
          </button>
        </form>
      </div>

      <div className="rounded-[24px] border border-sky-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-blue-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">Barangay Admins</h3>
            <p className="text-sm text-slate-500">Reset a specific barangay admin&apos;s password.</p>
          </div>
        </div>

        {loading ? (
          <LoadingRow text="Loading admins..." />
        ) : (
          <div className="space-y-2.5">
            {(data?.barangays || []).map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 ring-1 ring-sky-100">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900">{b.name}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {b.admin ? b.admin.username : "No admin assigned"}
                    </p>
                  </div>
                </div>
                {b.admin && (
                  <button
                    type="button"
                    onClick={() => setResetFor({ id: b.admin!.id, username: b.admin!.username })}
                    className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                  >
                    <KeyRound className="h-4 w-4" />
                    Reset Password
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {resetFor && (
        <ResetPasswordModal
          username={resetFor.username}
          adminId={resetFor.id}
          onClose={() => setResetFor(null)}
        />
      )}
    </div>
  );
}

function ResetPasswordModal({
  username,
  adminId,
  onClose,
}: {
  username: string;
  adminId: string;
  onClose: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [myPassword, setMyPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async () => {
    setError("");
    setMessage("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (!myPassword.trim()) {
      setError("Enter your super-admin password to confirm.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/staff/${adminId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: myPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to reset password.");
        return;
      }
      setMessage("Password reset successfully.");
      setNewPassword("");
      setMyPassword("");
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Reset Admin Password</h2>
            <p className="text-sm text-slate-500">
              For <span className="font-semibold text-slate-700">{username}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="New Password" type="password" value={newPassword} onChange={setNewPassword} />
          <Field label="Your Super-Admin Password" type="password" value={myPassword} onChange={setMyPassword} />
        </div>

        {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        {message && <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {message ? "Close" : "Cancel"}
          </button>
          {!message && (
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="rounded-2xl bg-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex min-w-0 flex-col justify-between rounded-xl border border-sky-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:mb-3 sm:h-12 sm:w-12 sm:rounded-2xl">
        {icon}
      </div>
      <div>
        <p className="line-clamp-2 text-[10px] leading-tight text-slate-500 sm:text-sm">{label}</p>
        <p className="mt-0.5 text-xl font-extrabold text-slate-900 sm:mt-2 sm:text-3xl">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white px-2 py-2 text-center ring-1 ring-slate-100">
      <p className="text-base font-black text-slate-900">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function TableCard({
  title,
  subtitle,
  icon,
  search,
  onSearch,
  count,
  filterControl,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  search: string;
  onSearch: (v: string) => void;
  count: number;
  filterControl?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-sky-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-blue-700">{icon}</div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h3>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          {filterControl}
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search..."
              className="min-h-[46px] w-full rounded-2xl border border-sky-200 bg-sky-50 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>
        </div>
      </div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{count} record(s)</p>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function BarangayFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative w-full sm:w-56">
      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[46px] w-full cursor-pointer rounded-2xl border border-sky-200 bg-sky-50 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
      >
        <option value="ALL">All Barangays</option>
        {options.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
    </div>
  );
}

function LoadingRow({ text }: { text: string }) {
  return <InlineLoader label={text} />;
}

function EmptyRow({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">{text}</div>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
      />
    </div>
  );
}
