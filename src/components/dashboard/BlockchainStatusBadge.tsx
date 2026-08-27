"use client";

import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";

type Status = "loading" | "online" | "offline" | "disabled";

const CONFIG: Record<Status, { label: string; cls: string; dot: string }> = {
  loading: {
    label: "Blockchain…",
    cls: "bg-slate-100 text-slate-500 ring-slate-200",
    dot: "bg-slate-400",
  },
  online: {
    label: "Blockchain Online",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  disabled: {
    label: "Blockchain Off",
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  offline: {
    label: "Blockchain Offline",
    cls: "bg-red-50 text-red-600 ring-red-200",
    dot: "bg-red-500",
  },
};

export function BlockchainStatusBadge({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/blockchain/status", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok) {
          setStatus("offline");
          return;
        }
        if (json?.enabled === false) setStatus("disabled");
        else if (json?.blockchain === "online") setStatus("online");
        else setStatus("offline");
      } catch {
        if (active) setStatus("offline");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const cfg = CONFIG[status];

  return (
    <span
      title="Blockchain anchoring status"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ring-1 ${cfg.cls} ${className}`}
    >
      <Link2 className="h-3.5 w-3.5" />
      {cfg.label}
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
    </span>
  );
}
