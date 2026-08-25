"use client";

import { useCallback, useEffect, useState } from "react";
import { Baby, CheckCircle2, Clock } from "lucide-react";
import { MaternalRecordView } from "./MaternalRecordView";

type MaternalState = {
  sex: string;
  isPregnant: boolean;
  record: {
    data: Record<string, string> | null;
    updatedAt: string | null;
    updatedBy: { fullName?: string | null; role?: string | null } | null;
  } | null;
};

export function ResidentMaternalTab() {
  const [state, setState] = useState<MaternalState | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/residents/me/maternal", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load maternal records.");
        return;
      }
      setState(json);
    } catch (err) {
      console.error("RESIDENT_MATERNAL_ERROR", err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markPregnant = async () => {
    try {
      setMarking(true);
      setError("");
      const res = await fetch("/api/residents/me/maternal", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Failed to update.");
        return;
      }
      await load();
    } catch (err) {
      console.error("MARK_PREGNANT_ERROR", err);
      setError("Unable to connect to the server.");
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[160px] items-center justify-center gap-3 rounded-2xl border border-sky-200 bg-white text-sm font-semibold text-sky-600">
        <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-sky-200 border-t-sky-500" />
        Loading maternal records...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
        {error}
      </div>
    );
  }

  if (!state?.isPregnant) {
    return (
      <div className="rounded-2xl border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 to-white p-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-200">
          <Baby className="h-9 w-9" />
        </div>
        <h3 className="text-2xl font-black text-slate-900">Maternal Records</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          You are not currently marked as pregnant. If you are already pregnant,
          tap the button below so your barangay health workers can start your
          maternal record.
        </p>
        <button
          type="button"
          onClick={markPregnant}
          disabled={marking}
          className="mt-5 inline-flex min-h-[50px] items-center gap-2 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/25 transition hover:from-pink-600 hover:to-rose-600 disabled:opacity-60"
        >
          <Baby className="h-4 w-4" />
          {marking ? "Updating..." : "I am already pregnant"}
        </button>
      </div>
    );
  }

  if (!state.record) {
    return (
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-black uppercase text-pink-700">
          <Baby className="h-3.5 w-3.5" />
          Pregnant
        </div>
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-amber-600 shadow-sm ring-1 ring-amber-200">
            <Clock className="h-9 w-9" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">Processing Information</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Your maternal record is being prepared by your barangay health worker
            (midwife, nurse, or BHW). Your prenatal and pregnancy details will
            appear here once recorded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-black uppercase text-pink-700">
          <Baby className="h-3.5 w-3.5" />
          Pregnant
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Record Available
        </span>
      </div>
      <MaternalRecordView
        data={state.record.data}
        updatedBy={state.record.updatedBy}
        updatedAt={state.record.updatedAt}
      />
    </div>
  );
}
