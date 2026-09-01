"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function DeleteAccountModal({
  name,
  residentId,
  userId,
  onClose,
  onDeleted,
}: {
  name: string;
  residentId?: string;
  userId?: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!password.trim()) {
      setError("Enter your super-admin password.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/superadmin/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, residentId, userId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to delete.");
        return;
      }
      onDeleted();
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={() => !loading && onClose()}
    >
      <div
        className="w-full max-w-md rounded-[28px] border border-red-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Delete account?</h3>
          </div>
          <button onClick={onClose} className="rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-600">
          This permanently deletes <strong>{name}</strong>
          {residentId ? " and all of their medical records" : " and their account"}. This cannot be undone.
        </p>
        <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-500">
          Confirm with your super-admin password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-1.5 min-h-[48px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
        />
        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>
        )}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={submit}
            className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
