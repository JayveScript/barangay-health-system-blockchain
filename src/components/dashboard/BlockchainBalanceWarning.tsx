"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Coins } from "lucide-react";

type Balance = {
  configured: boolean;
  address?: string;
  balanceEth?: number;
  gasPriceGwei?: number;
  estTxLeft?: number;
  low?: boolean;
};

export function BlockchainBalanceWarning({ className = "" }: { className?: string }) {
  const [data, setData] = useState<Balance | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/superadmin/blockchain-balance", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as Balance | null;
        if (active && res.ok) setData(json);
      } catch {
        /* ignore — a balance read failure should never block the dashboard */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Nothing to show until we have a configured wallet reading.
  if (!data || !data.configured) return null;

  const eth = (data.balanceEth ?? 0).toFixed(5);
  const txLeft = data.estTxLeft ?? 0;

  if (data.low) {
    return (
      <div
        className={`flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 ${className}`}
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="text-sm">
          <p className="font-black text-amber-800">Low blockchain balance</p>
          <p className="mt-0.5 font-semibold text-amber-700">
            The anchoring wallet has <strong>{eth} ETH</strong> — about{" "}
            <strong>{txLeft} more anchor{txLeft === 1 ? "" : "s"}</strong> left. Top it up
            from a Sepolia faucet before it runs out, or new medical records / referrals
            won&apos;t be sealed on-chain.
          </p>
        </div>
      </div>
    );
  }

  return (
    <span
      title="Anchoring wallet balance (Sepolia)"
      className={`inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200 ${className}`}
    >
      <Coins className="h-3.5 w-3.5 text-slate-500" />
      {eth} ETH · ~{txLeft} anchors left
    </span>
  );
}
