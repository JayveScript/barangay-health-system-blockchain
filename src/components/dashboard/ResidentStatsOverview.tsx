"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  ShieldCheck,
  UserRound,
  PieChart as PieChartIcon,
  BarChart3,
} from "lucide-react";
import { DonutChart, BarList } from "./Charts";

// Matches the sex slices in /api/residents/stats.
const SEX_COLORS = ["#075985", "#7DD3FC", "#94A3B8"];

type StatsResponse = {
  stats: { totalResidents: number; verifiedResidents: number; other: number };
  sex: { name: string; value: number }[];
  ageGroups: { name: string; total: number }[];
  barangayName?: string | null;
};

/**
 * Live resident statistics overview for the staff / BHW dashboards.
 * Fetches the current user's barangay stats and renders real stat cards,
 * a sex-distribution donut, and an age-group bar chart.
 */
export function ResidentStatsOverview() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/residents/stats");
        const json = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(json.error || "Failed to load statistics.");
          return;
        }
        if (!cancelled) setData(json as StatsResponse);
      } catch {
        if (!cancelled) setError("Unable to connect to the server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-[24px] border border-sky-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">
        Loading resident statistics...
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

  if (!data) return null;

  return (
    <div className="space-y-5 pb-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-4 [&>*]:min-w-0">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Residents"
          value={data.stats.totalResidents}
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Verified Residents"
          value={data.stats.verifiedResidents}
        />
        <StatCard
          icon={<UserRound className="h-5 w-5" />}
          label="Other / Not Set"
          value={data.stats.other}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <ChartCard
          icon={<PieChartIcon className="h-5 w-5" />}
          title="Resident Sex Distribution"
          subtitle="Male, female, and other registered residents"
        >
          <DonutChart data={data.sex} colors={SEX_COLORS} />
        </ChartCard>

        <ChartCard
          icon={<BarChart3 className="h-5 w-5" />}
          title="Age Group Distribution"
          subtitle="Resident population by age group"
        >
          <BarList data={data.ageGroups} />
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex min-w-0 flex-col justify-between rounded-xl border border-sky-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 sm:mb-3 sm:h-12 sm:w-12 sm:rounded-2xl">
        {icon}
      </div>
      <div>
        <p className="line-clamp-2 text-[10px] leading-tight text-slate-500 sm:text-sm">
          {label}
        </p>
        <p className="mt-0.5 text-xl font-extrabold text-slate-900 sm:mt-2 sm:text-3xl">
          {value}
        </p>
      </div>
    </div>
  );
}

function ChartCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[24px] border border-sky-200 bg-white p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h3>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
