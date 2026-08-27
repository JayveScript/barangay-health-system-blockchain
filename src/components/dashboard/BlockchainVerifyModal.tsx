"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Link2, Loader2, X } from "lucide-react";

type VerifyResult = {
  recordType: string;
  label: string;
  status: "verified" | "changed" | "not_anchored" | "disabled" | "error";
  onChainHash?: string;
  currentHash?: string;
  anchoredAt?: string | null;
};

type VerifyResident = {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
};

export function BlockchainVerifyModal({
  resident,
  onClose,
}: {
  resident: VerifyResident;
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
  const allVerified = results.length > 0 && results.every((r) => r.status === "verified");

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
          Only medical records are sealed on the blockchain and kept tamper-proof — new findings can be added (each re-seals a new immutable version), but past records cannot be secretly edited. Identity like name and address is editable and is not sealed. Verification re-hashes the current record and compares it to the latest on-chain seal.
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
