"use client";

import { useEffect, useState } from "react";
import { FileBarChart2, Baby, HeartHandshake, RefreshCw } from "lucide-react";
import { ExportPdfButton } from "@/components/dashboard/ExportPdfButton";

type Row = {
  label: string;
  indent?: number;
  header?: boolean;
  isData?: boolean;
  // maternal shape
  b1014?: number;
  b1519?: number;
  b2049?: number;
  total?: number;
  // family-planning shape
  na?: number;
  oa?: number;
  do?: number;
  cu?: number;
};

type ReportData = {
  scope: string;
  totalRecords: number;
  rows: Row[];
};

type ReportId = "maternal" | "familyplanning";

const REPORTS: {
  id: ReportId;
  label: string;
  icon: React.ReactNode;
  endpoint: string;
  title: string;
  subtitle: string;
  columns: "age" | "fp";
}[] = [
  {
    id: "maternal",
    label: "Maternal Summary",
    icon: <Baby className="h-4 w-4" />,
    endpoint: "/api/reports/maternal",
    title: "Maternal Health Care Summary",
    subtitle: "DOH FHSIS · BHS SUMTAB — Prenatal, Intrapartum & Postpartum",
    columns: "age",
  },
  {
    id: "familyplanning",
    label: "Family Planning",
    icon: <HeartHandshake className="h-4 w-4" />,
    endpoint: "/api/reports/family-planning",
    title: "Family Planning Program",
    subtitle: "DOH FHSIS · FP M1 — Acceptors by method and age group",
    columns: "fp",
  },
];

export function ReportsTab() {
  const [active, setActive] = useState<ReportId>("maternal");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const current = REPORTS.find((r) => r.id === active)!;

  const load = async (report = current) => {
    try {
      setLoading(true);
      setError("");
      setData(null);
      const res = await fetch(report.endpoint, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load report.");
        return;
      }
      setData(json);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const isFp = current.columns === "fp";

  return (
    <div className="space-y-5 pb-4">
      {/* Report picker */}
      <div className="flex flex-wrap gap-2">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setActive(r.id)}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
              active === r.id
                ? "border-[#2563EB] bg-[#2563EB] text-white shadow-sm"
                : "border-[#BFDBFE] bg-white text-slate-600 hover:bg-[#EFF6FF]"
            }`}
          >
            {r.icon}
            {r.label}
          </button>
        ))}
      </div>

      <div className="print-area space-y-5">
        {/* Header card */}
        <div className="overflow-hidden rounded-[28px] border border-[#BFDBFE] bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <FileBarChart2 className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                  Report
                </p>
                <h2 className="text-2xl font-black leading-tight">{current.title}</h2>
                <p className="mt-0.5 text-sm text-white/80">{current.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => load(current)}
                className="no-print inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <ExportPdfButton fileName={isFp ? "family-planning-report" : "maternal-summary"} />
            </div>
          </div>

          {data && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatTile label="Coverage" value={data.scope} />
              <StatTile
                label={isFp ? "FP Clients" : "Maternal Records"}
                value={String(data.totalRecords)}
              />
              <StatTile label="Generated" value={new Date().toLocaleDateString()} />
            </div>
          )}
        </div>

        {/* Table card */}
        <div className="overflow-hidden rounded-[28px] border border-[#BFDBFE] bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center gap-3 text-sm font-semibold text-[#2563EB]">
              <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#DBEAFE] border-t-[#2563EB]" />
              Building report...
            </div>
          ) : error ? (
            <div className="p-6 text-sm font-semibold text-red-600">{error}</div>
          ) : data ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="bg-[#EFF6FF] text-[#1E3A8A]">
                    <th className="sticky left-0 z-10 bg-[#EFF6FF] px-4 py-3 text-left text-xs font-black uppercase tracking-wide">
                      {isFp ? "Method / Age Group" : "Indicator"}
                    </th>
                    {isFp ? (
                      <>
                        <Th title="NA">NA</Th>
                        <Th title="OA">OA</Th>
                        <Th title="DO">DO</Th>
                        <Th title="CU">CU</Th>
                      </>
                    ) : (
                      <>
                        <Th>10–14</Th>
                        <Th>15–19</Th>
                        <Th>20–49</Th>
                        <Th>Total</Th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, i) => {
                    if (row.header) {
                      return (
                        <tr key={i}>
                          <td colSpan={5} className="bg-[#2563EB] px-4 py-2.5 text-sm font-black uppercase tracking-wide text-white">
                            {row.label}
                          </td>
                        </tr>
                      );
                    }
                    if (!row.isData) {
                      return (
                        <tr key={i} className="border-t border-slate-100 bg-[#F8FAFC]">
                          <td colSpan={5} className="px-4 py-2 text-sm font-black text-slate-800">
                            {row.label}
                          </td>
                        </tr>
                      );
                    }
                    const pad = 16 + (row.indent ?? 0) * 18;
                    return (
                      <tr key={i} className="border-t border-slate-100 hover:bg-[#F8FAFC]">
                        <td
                          className="sticky left-0 z-10 bg-white px-4 py-2 font-semibold text-slate-700"
                          style={{ paddingLeft: pad }}
                        >
                          {row.label}
                        </td>
                        {isFp ? (
                          <>
                            <Num v={row.na} />
                            <Num v={row.oa} />
                            <Num v={row.do} />
                            <Num v={row.cu} total />
                          </>
                        ) : (
                          <>
                            <Num v={row.b1014} />
                            <Num v={row.b1519} />
                            <Num v={row.b2049} />
                            <Num v={row.total} total />
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {isFp ? (
          <p className="text-xs font-semibold text-slate-400">
            NA — New Acceptor · OA — Other Acceptor (shifters / changing method /
            clinic / restart) · DO — Drop-out · CU — Current User. Counted live from
            the Family Planning form (method, client type, resident age).
          </p>
        ) : (
          <p className="text-xs font-semibold text-slate-400">
            Counts are computed live from the maternal records staff have encoded
            (OB-Gyne, Prenatal, Postnatal). Age bands use the resident&apos;s age.
          </p>
        )}
      </div>
    </div>
  );
}

function Th({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <th
      title={title}
      className="px-3 py-3 text-center text-xs font-black uppercase tracking-wide"
    >
      {children}
    </th>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-white/60">{label}</p>
      <p className="mt-0.5 truncate text-base font-black">{value}</p>
    </div>
  );
}

function Num({ v, total }: { v?: number; total?: boolean }) {
  const n = v ?? 0;
  return (
    <td
      className={`px-3 py-2 text-center tabular-nums ${
        total ? "font-black text-[#1E3A8A]" : "font-semibold text-slate-600"
      } ${n === 0 ? "text-slate-300" : ""}`}
    >
      {n}
    </td>
  );
}
