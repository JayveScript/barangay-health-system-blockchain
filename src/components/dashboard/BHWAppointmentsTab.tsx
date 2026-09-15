"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  Phone,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { InlineLoader } from "@/components/dashboard/InlineLoader";

type Appointment = {
  id: string;
  date: string;
  time: string;
  reason: string;
  otherReason?: string | null;
  suggestion?: string | null;
  status: string;
  doctor?: { id: string; fullName?: string | null } | null;
  resident?: {
    id: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    age?: number | null;
    sex?: string | null;
    contactNumber?: string | null;
  } | null;
};

type Filter = "ALL" | "PENDING" | "ACCEPTED" | "REJECTED";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "REJECTED", label: "Rejected" },
];

function residentName(a: Appointment) {
  const r = a.resident;
  if (!r) return "Resident";
  return `${r.firstName} ${r.middleName ?? ""} ${r.lastName}`.replace(/\s+/g, " ").trim();
}
function longDate(v: string) {
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    ACCEPTED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${map[status] ?? "bg-slate-200 text-slate-500"}`}>
      {status}
    </span>
  );
}

export function BHWAppointmentsTab() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/bhw/appointments", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load appointments.");
        return;
      }
      setItems(Array.isArray(json) ? json : []);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: "ACCEPTED" | "REJECTED") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/bhw/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await load();
    } finally {
      setBusyId(null);
    }
  };

  const shown = filter === "ALL" ? items : items.filter((a) => a.status === filter);

  return (
    <div className="space-y-5 pb-4">
      <div className="rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-900">Manage Appointments</h2>
            <p className="text-sm text-slate-500">Review and accept or reject residents&apos; appointments.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                filter === f.id ? "bg-[#0EA5E9] text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>
      )}

      {loading ? (
        <InlineLoader label="Loading appointments..." />
      ) : shown.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 to-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-200">
            <CalendarDays className="h-9 w-9" />
          </div>
          <h3 className="text-xl font-black text-slate-900">No appointments</h3>
          <p className="mt-2 text-sm text-slate-500">No {filter === "ALL" ? "" : filter.toLowerCase()} appointments to show.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((a) => (
            <div key={a.id} className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-900">{residentName(a)}</p>
                    <p className="text-xs font-semibold text-slate-400">
                      {a.resident?.age ? `${a.resident.age} yrs` : ""}
                      {a.resident?.sex ? ` · ${a.resident.sex}` : ""}
                    </p>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <CalendarDays className="h-3.5 w-3.5 text-sky-500" /> {longDate(a.date)}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Clock className="h-3.5 w-3.5 text-sky-500" /> {a.time}
                </div>
                {a.doctor?.fullName && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Stethoscope className="h-3.5 w-3.5 text-sky-500" /> Dr. {a.doctor.fullName}
                  </div>
                )}
                {a.resident?.contactNumber && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-sky-500" /> {a.resident.contactNumber}
                  </div>
                )}
              </div>

              <p className="mt-2 text-sm text-slate-700">
                <span className="font-black text-slate-500">Reason: </span>
                {a.reason}
                {a.otherReason ? ` — ${a.otherReason}` : ""}
              </p>

              {a.status === "PENDING" && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => setStatus(a.id, "ACCEPTED")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" /> Accept
                  </button>
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => setStatus(a.id, "REJECTED")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              )}
              {a.status !== "PENDING" && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => setStatus(a.id, a.status === "ACCEPTED" ? "REJECTED" : "ACCEPTED")}
                    className="text-xs font-black text-slate-500 underline underline-offset-2 hover:text-slate-700 disabled:opacity-60"
                  >
                    {a.status === "ACCEPTED" ? "Change to Rejected" : "Change to Accepted"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
