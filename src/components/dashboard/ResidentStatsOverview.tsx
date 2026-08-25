"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  ShieldCheck,
  UserRound,
  PieChart as PieChartIcon,
  BarChart3,
  UserPlus,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Scale,
  Megaphone,
  Activity,
} from "lucide-react";
import { DonutChart, BarList } from "./Charts";
import { InlineLoader } from "./InlineLoader";

const SEX_COLORS = ["#075985", "#7DD3FC", "#94A3B8"];

type StatsResponse = {
  stats: { totalResidents: number; verifiedResidents: number; other: number };
  sex: { name: string; value: number }[];
  ageGroups: { name: string; total: number }[];
  barangayName?: string | null;
};

type OverviewResponse = {
  pendingRegistrations: number;
  referralsReceived: number;
  referralsSent: number;
  pendingReferrals: number;
  logbookTotal: number;
  logbookToday: number;
  bmiTotal: number;
  bmiToday: number;
  announcements: number;
};

export function ResidentStatsOverview() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [statsRes, overviewRes] = await Promise.all([
          fetch("/api/residents/stats"),
          fetch("/api/staff/overview"),
        ]);
        const statsJson = await statsRes.json();
        if (!statsRes.ok) {
          if (!cancelled)
            setError(statsJson.error || "Failed to load statistics.");
          return;
        }
        if (!cancelled) setData(statsJson as StatsResponse);

        if (overviewRes.ok) {
          const overviewJson = await overviewRes.json();
          if (!cancelled) setOverview(overviewJson as OverviewResponse);
        }
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
    return <InlineLoader label="Loading resident statistics..." />;
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

      {overview && (
        <div className="rounded-[24px] border border-sky-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                Health Center Activity
              </h3>
              <p className="text-sm text-slate-500">
                A summary across registration, referrals, logbook, BMI, and
                announcements.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 [&>*]:min-w-0">
            <StatCard
              icon={<UserPlus className="h-5 w-5" />}
              label="Pending Registrations"
              value={overview.pendingRegistrations}
              detail="Awaiting verification"
            />
            <StatCard
              icon={<ArrowDownLeft className="h-5 w-5" />}
              label="Referrals Received"
              value={overview.referralsReceived}
              detail={`${overview.pendingReferrals} pending`}
            />
            <StatCard
              icon={<ArrowUpRight className="h-5 w-5" />}
              label="Referrals Sent"
              value={overview.referralsSent}
              detail="To other barangays"
            />
            <StatCard
              icon={<BookOpen className="h-5 w-5" />}
              label="Logbook Visits"
              value={overview.logbookTotal}
              detail={`${overview.logbookToday} today`}
            />
            <StatCard
              icon={<Scale className="h-5 w-5" />}
              label="BMI Records"
              value={overview.bmiTotal}
              detail={`${overview.bmiToday} today`}
            />
            <StatCard
              icon={<Megaphone className="h-5 w-5" />}
              label="Announcements"
              value={overview.announcements}
              detail="Posted in barangay"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail?: string;
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
        {detail && (
          <p className="mt-0.5 line-clamp-1 text-[9px] font-semibold text-sky-600 sm:text-xs">
            {detail}
          </p>
        )}
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
