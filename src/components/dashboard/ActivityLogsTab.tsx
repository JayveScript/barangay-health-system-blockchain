"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarCheck,
  Clock,
  RefreshCw,
  ScanLine,
  Scale,
  Search,
  Send,
  Stethoscope,
} from "lucide-react";

type ActivityItem = {
  id: string;
  type: "diagnosis" | "bmi" | "availability" | "referral" | "qr-scan";
  action: string;
  detail: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
};

const TYPE_STYLES: Record<
  ActivityItem["type"],
  { icon: React.ReactNode; wrap: string }
> = {
  diagnosis: {
    icon: <Stethoscope className="h-5 w-5" />,
    wrap: "bg-rose-50 text-rose-600 ring-rose-100",
  },
  bmi: {
    icon: <Scale className="h-5 w-5" />,
    wrap: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  },
  availability: {
    icon: <CalendarCheck className="h-5 w-5" />,
    wrap: "bg-sky-50 text-sky-600 ring-sky-100",
  },
  referral: {
    icon: <Send className="h-5 w-5" />,
    wrap: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  "qr-scan": {
    icon: <ScanLine className="h-5 w-5" />,
    wrap: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  },
};

const ROLE_FILTERS = ["ALL", "DOCTOR", "NURSE", "STAFF", "BHW", "MIDWIFE"];

function humanizeRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} day${day > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ActivityLogsTab() {
  const [logs, setLogs] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/activity-logs");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load activity logs.");
        return;
      }
      setLogs(json.logs || []);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const roleCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of logs) map[log.actorRole] = (map[log.actorRole] || 0) + 1;
    return map;
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (roleFilter !== "ALL" && log.actorRole !== roleFilter) return false;
      if (!q) return true;
      return (
        log.actorName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.detail.toLowerCase().includes(q)
      );
    });
  }, [logs, roleFilter, search]);

  return (
    <div className="rounded-[24px] border border-sky-200 bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Activity Logs</h2>
            <p className="text-sm text-slate-500">
              What staff, nurses, doctors, and BHWs have been doing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-64">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or action..."
              className="min-h-[46px] w-full rounded-2xl border border-sky-200 bg-sky-50 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100 disabled:opacity-60"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Role filter chips */}
      <div className="-mx-1 mb-4 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ROLE_FILTERS.map((role) => {
          const count = role === "ALL" ? logs.length : roleCounts[role] || 0;
          const active = roleFilter === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold transition ${
                active
                  ? "bg-[#0EA5E9] text-white shadow-sm shadow-sky-500/25"
                  : "border border-sky-200 bg-white text-slate-600 hover:bg-sky-50"
              }`}
            >
              {role === "ALL" ? "All" : humanizeRole(role)}
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
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-10 text-center text-sm font-semibold text-sky-600">
          Loading activity logs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-sky-200 bg-sky-50 px-4 py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-sky-600 ring-1 ring-sky-200">
            <Activity className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900">No activity yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Staff activity will appear here as it happens.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((log) => {
            const style = TYPE_STYLES[log.type];
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-[20px] border border-slate-100 bg-white p-3.5 shadow-sm sm:p-4"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${style.wrap}`}
                >
                  {style.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-slate-900">
                      {log.actorName}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
                      {humanizeRole(log.actorRole)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {relativeTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {log.action}
                  </p>
                  <p className="text-sm text-slate-500">{log.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
