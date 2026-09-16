"use client";

import { useState } from "react";
import { Blocks, Loader2 } from "lucide-react";

// Super-admin one-time action: anchor every existing resident's medical
// records on-chain (for records created while the blockchain was off).
export function AnchorAllButton({ className = "" }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (busy) return;
    if (!window.confirm("Anchor all existing resident records on the blockchain now? This spends test ETH (one transaction per record).")) {
      return;
    }
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/anchor-all", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Backfill failed.");
        return;
      }
      setResult(json.message || "Backfill submitted.");
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Blocks className="h-4 w-4" />}
        {busy ? "Anchoring…" : "Anchor all existing records"}
      </button>
      {result && (
        <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{result}</p>
      )}
      {error && (
        <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>
      )}
    </div>
  );
}
