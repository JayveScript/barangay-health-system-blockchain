"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, MessageSquareWarning, Send, UserRound } from "lucide-react";
import { formatRoleLabel } from "@/lib/role-labels";

type Complaint = {
  id: string;
  text: string;
  createdAt: string;
  createdBy: {
    fullName: string | null;
    role: string;
    barangay: { name: string } | null;
  } | null;
};

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Complaints panel.
 * - When `residentId` is provided (QR scan / staff view), the viewer can add
 *   complaints and see the list (uses /api/residents/[id]/complaints).
 * - Without it (resident's own dashboard), it is read-only
 *   (uses /api/residents/me/complaints).
 */
export function ResidentComplaints({ residentId }: { residentId?: string }) {
  const canAdd = !!residentId;
  const endpoint = residentId
    ? `/api/residents/${residentId}/complaints`
    : `/api/residents/me/complaints`;

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(endpoint, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load complaints.");
        return;
      }
      setComplaints(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error("COMPLAINTS_LOAD_ERROR", err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!residentId) return;
    const value = text.trim();
    if (!value) {
      setError("Please type the complaint first.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      const res = await fetch(`/api/residents/${residentId}/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to add complaint.");
        return;
      }
      setMessage("Complaint added.");
      setText("");
      await load();
    } catch (err) {
      console.error("COMPLAINTS_ADD_ERROR", err);
      setError("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {canAdd && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 sm:p-5">
          <label className="mb-2 block text-xs font-black uppercase tracking-wide text-sky-700">
            Add Patient Complaint
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Type the patient's complaint (e.g. fever and cough for 3 days)..."
            className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-sky-500"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-2xl bg-[#0EA5E9] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Adding..." : "Add Complaint"}
            </button>
            {message && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {message}
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[120px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-sky-200 bg-white px-4 py-8 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-sky-200 border-t-sky-500" />
          <p className="text-sm font-semibold text-sky-600">Loading complaints...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 to-white p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-200">
            <MessageSquareWarning className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900">No complaints yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            {canAdd
              ? "Recorded complaints will appear here."
              : "Complaints recorded by health workers will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {c.createdBy?.fullName?.trim() || "Health Worker"}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">
                      {c.createdBy ? formatRoleLabel(c.createdBy.role) : "Staff"}
                      {c.createdBy?.barangay?.name
                        ? ` · ${c.createdBy.barangay.name}`
                        : ""}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
                  {formatDateTime(c.createdAt)}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                {c.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
