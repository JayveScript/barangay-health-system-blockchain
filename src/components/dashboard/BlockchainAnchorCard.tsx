"use client";

import { useEffect, useState } from "react";
import { Blocks, ExternalLink } from "lucide-react";

type MedicalAnchorView = {
  configured: boolean;
  anchored: boolean;
  recordHash?: string;
  timestamp?: number;
  blockNumber?: number;
  txHash?: string;
  contractAddress?: string;
  network?: string;
  explorer?: { tx?: string; block?: string; address?: string };
};

function shortHash(h: string): string {
  return h && h.length > 16 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;
}

export function BlockchainAnchorCard({
  endpoint,
  anchor: anchorProp,
  className = "",
}: {
  endpoint?: string;
  anchor?: MedicalAnchorView | null;
  className?: string;
}) {
  const [fetched, setFetched] = useState<MedicalAnchorView | null>(null);

  useEffect(() => {
    if (anchorProp !== undefined || !endpoint) return;
    let active = true;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        const json = (await res
          .json()
          .catch(() => null)) as MedicalAnchorView | null;
        if (!active || !res.ok || !json) return;
        setFetched(json);
        if (json.configured && !json.anchored && tries < 5) {
          tries++;
          timer = setTimeout(load, 8000);
        }
      } catch {
      }
    };

    load();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [endpoint, anchorProp]);

  const anchor = anchorProp !== undefined ? anchorProp : fetched;

  if (!anchor) return null;

  if (!anchor.anchored) {
    if (!anchor.configured) return null;
    return (
      <div
        className={`flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 ${className}`}
      >
        <Blocks className="h-4 w-4 text-slate-400" />
        This medical record isn&apos;t anchored on the blockchain yet.
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-full overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-3 shadow-sm sm:p-4 ${className}`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Blocks className="h-4 w-4" />
        </span>
        <h4 className="text-[13px] font-black uppercase tracking-wide text-indigo-900 sm:text-sm">
          Secured on Blockchain
        </h4>
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-indigo-700">
          {anchor.network ?? "sepolia"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-indigo-100 bg-white px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Block Number
          </p>
          {anchor.blockNumber ? (
            <a
              href={anchor.explorer?.block}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-flex max-w-full items-center gap-1 break-all text-sm font-black text-indigo-700 hover:underline"
            >
              #{anchor.blockNumber} <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ) : (
            <p className="mt-0.5 text-sm font-semibold text-slate-400">
              Not found (older than 3 weeks)
            </p>
          )}
        </div>
        <div className="min-w-0 rounded-xl border border-indigo-100 bg-white px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Transaction
          </p>
          {anchor.txHash ? (
            <a
              href={anchor.explorer?.tx}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-flex max-w-full items-center gap-1 break-all text-sm font-bold text-indigo-700 hover:underline"
            >
              {shortHash(anchor.txHash)}{" "}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ) : (
            <p className="mt-0.5 text-sm font-semibold text-slate-400">—</p>
          )}
        </div>
        <div className="min-w-0 rounded-xl border border-indigo-100 bg-white px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Record Hash
          </p>
          <p className="mt-0.5 break-all text-sm font-semibold text-slate-800">
            {shortHash(anchor.recordHash ?? "")}
          </p>
        </div>
        <div className="min-w-0 rounded-xl border border-indigo-100 bg-white px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Anchored
          </p>
          <p className="mt-0.5 break-words text-sm font-semibold text-slate-800">
            {anchor.timestamp
              ? new Date(anchor.timestamp * 1000).toLocaleString()
              : "—"}
          </p>
        </div>
      </div>
      {anchor.explorer?.address && (
        <a
          href={anchor.explorer.address}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex max-w-full items-center gap-1 break-all text-xs font-black text-indigo-600 hover:underline"
        >
          View registry contract <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      )}
    </div>
  );
}
