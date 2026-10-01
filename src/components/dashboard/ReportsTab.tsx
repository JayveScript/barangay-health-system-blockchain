"use client";

import { useEffect, useState } from "react";
import { FileBarChart2, Baby, HeartHandshake, ShieldPlus, Syringe, RefreshCw, FileSpreadsheet, Download } from "lucide-react";
import type { Cell } from "exceljs";
import type { jsPDF as JsPDFType } from "jspdf";

type Row = {
  label: string;
  indent?: number;
  header?: boolean;
  isData?: boolean;
  b1014?: number;
  b1519?: number;
  b2049?: number;
  total?: number;
  na?: number;
  oa?: number;
  do?: number;
  cu?: number;
  m?: number;
  f?: number;
  t?: number;
};

type ReportData = {
  scope: string;
  totalRecords: number;
  rows: Row[];
};

type ReportId = "maternal" | "familyplanning" | "philpen" | "immunization";

const REPORTS: {
  id: ReportId;
  label: string;
  icon: React.ReactNode;
  endpoint: string;
  title: string;
  subtitle: string;
  columns: "age" | "fp" | "ncd";
  countLabel: string;
  note: string;
}[] = [
  {
    id: "maternal",
    label: "Maternal Summary",
    icon: <Baby className="h-4 w-4" />,
    endpoint: "/api/reports/maternal",
    title: "Maternal Health Care Summary",
    subtitle: "DOH FHSIS · BHS SUMTAB — Prenatal, Intrapartum & Postpartum",
    columns: "age",
    countLabel: "Maternal Records",
    note: "Counts are computed live from the maternal records staff have encoded (OB-Gyne, Prenatal, Postnatal). Age bands use the resident's age.",
  },
  {
    id: "familyplanning",
    label: "Family Planning",
    icon: <HeartHandshake className="h-4 w-4" />,
    endpoint: "/api/reports/family-planning",
    title: "Family Planning Program",
    subtitle: "DOH FHSIS · FP M1 — Acceptors by method and age group",
    columns: "fp",
    countLabel: "FP Clients",
    note: "NA — New Acceptor · OA — Other Acceptor · DO — Drop-out · CU — Current User. Counted live from the Family Planning form (method, client type, resident age).",
  },
  {
    id: "philpen",
    label: "PhilPEN / NCD",
    icon: <ShieldPlus className="h-4 w-4" />,
    endpoint: "/api/reports/philpen",
    title: "NCD Summary (PhilPEN)",
    subtitle: "DOH FHSIS · PhilPEN Risk Assessment, Hypertension & Diabetes",
    columns: "ncd",
    countLabel: "Assessed (20+)",
    note: "M — Male · F — Female · T — Total. Counted live from the PhilPEN form (Adults 20–59, Senior 60+). Blindness, immunization, cancer, mental health and geriatrics need their own forms and aren't included here.",
  },
  {
    id: "immunization",
    label: "Child Immunization",
    icon: <Syringe className="h-4 w-4" />,
    endpoint: "/api/reports/immunization",
    title: "Child Immunization",
    subtitle: "DOH FHSIS · Immunization Services — doses given & FIC/CIC",
    columns: "ncd",
    countLabel: "Children with record",
    note: "M — Male · F — Female · T — Total. Counted live from the Child Immunization form (a dose counts when its date-given is filled). School-based immunization, nutrition and sick-children sections need their own forms and aren't included here.",
  },
];

function currentPeriodLabel() {
  return new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function ReportsTab() {
  const [active, setActive] = useState<ReportId>("maternal");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Report metadata for the printout / export header & signatories.
  const [period, setPeriod] = useState(currentPeriodLabel());
  const [preparedBy, setPreparedBy] = useState("");
  const [preparedByTitle, setPreparedByTitle] = useState("");
  const [notedBy, setNotedBy] = useState("");
  const [notedByTitle, setNotedByTitle] = useState("");

  const current = REPORTS.find((r) => r.id === active)!;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (!res.ok) return;
        const me = await res.json().catch(() => null);
        if (me?.fullName) setPreparedBy(String(me.fullName));
        if (me?.role) setPreparedByTitle(roleTitle(String(me.role)));
      } catch {
        /* non-fatal */
      }
    })();
  }, []);

  const [exportingPdf, setExportingPdf] = useState(false);
  const exportPdf = async () => {
    if (!data || exportingPdf) return;
    setExportingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = buildPdf(jsPDF, autoTable, current, data, {
        period,
        preparedBy,
        preparedByTitle,
        notedBy,
        notedByTitle,
      });
      const stamp = new Date().toISOString().slice(0, 10);
      doc.save(`${current.id}-report-${stamp}.pdf`);
    } catch (e) {
      console.error("EXPORT_PDF_ERROR", e);
      setError("Couldn't build the PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  const [exporting, setExporting] = useState(false);
  const exportExcel = async () => {
    if (!data || exporting) return;
    setExporting(true);
    try {
      const buffer = await buildWorkbook(current, data, {
        period,
        preparedBy,
        preparedByTitle,
        notedBy,
        notedByTitle,
      });
      const stamp = new Date().toISOString().slice(0, 10);
      downloadXlsx(buffer, `${current.id}-report-${stamp}.xlsx`);
    } catch (e) {
      console.error("EXPORT_XLSX_ERROR", e);
      setError("Couldn't build the Excel file. Please try again.");
    } finally {
      setExporting(false);
    }
  };

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
  }, [active]);

  const mode = current.columns;
  const isFp = mode === "fp";
  const isNcd = mode === "ncd";

  return (
    <div className="space-y-5 pb-4">
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
              <button
                type="button"
                onClick={exportExcel}
                disabled={!data || exporting}
                className="no-print inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {exporting ? "Preparing…" : "Export Excel"}
              </button>
              <button
                type="button"
                onClick={exportPdf}
                disabled={!data || exportingPdf}
                className="no-print inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {exportingPdf ? "Preparing…" : "Download PDF"}
              </button>
            </div>
          </div>

          {data && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Coverage" value={data.scope} />
              <EditableStatTile label="Reporting Period" value={period} onChange={setPeriod} />
              <StatTile label={current.countLabel} value={String(data.totalRecords)} />
              <StatTile label="Generated" value={new Date().toLocaleDateString()} />
            </div>
          )}
        </div>

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
                        <Th title="New Acceptor">NA</Th>
                        <Th title="Other Acceptor">OA</Th>
                        <Th title="Drop-out">DO</Th>
                        <Th title="Current User">CU</Th>
                      </>
                    ) : isNcd ? (
                      <>
                        <Th title="Male">M</Th>
                        <Th title="Female">F</Th>
                        <Th title="Total">T</Th>
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
                    const span = isNcd ? 4 : 5;
                    if (row.header) {
                      return (
                        <tr key={i}>
                          <td colSpan={span} className="bg-[#2563EB] px-4 py-2.5 text-sm font-black uppercase tracking-wide text-white">
                            {row.label}
                          </td>
                        </tr>
                      );
                    }
                    if (!row.isData) {
                      return (
                        <tr key={i} className="border-t border-slate-100 bg-[#F8FAFC]">
                          <td colSpan={span} className="px-4 py-2 text-sm font-black text-slate-800">
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
                        ) : isNcd ? (
                          <>
                            <Num v={row.m} />
                            <Num v={row.f} />
                            <Num v={row.t} total />
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

        <p className="text-xs font-semibold text-slate-400">{current.note}</p>

        <div className="rounded-[28px] border border-[#BFDBFE] bg-white p-5 shadow-sm sm:p-6">
          <p className="mb-4 text-xs font-black uppercase tracking-wide text-slate-500">
            Certification
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <SignatureBlock
              role="Prepared by"
              name={preparedBy}
              onName={setPreparedBy}
              title={preparedByTitle}
              onTitle={setPreparedByTitle}
            />
            <SignatureBlock
              role="Noted by"
              name={notedBy}
              onName={setNotedBy}
              title={notedByTitle}
              onTitle={setNotedByTitle}
            />
          </div>
        </div>
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

function EditableStatTile({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-white/60">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full bg-transparent text-base font-black text-white outline-none placeholder:text-white/40"
        placeholder="e.g. September 2026"
      />
    </div>
  );
}

function SignatureBlock({
  role,
  name,
  onName,
  title,
  onTitle,
}: {
  role: string;
  name: string;
  onName: (v: string) => void;
  title: string;
  onTitle: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{role}</p>
      <input
        value={name}
        onChange={(e) => onName(e.target.value)}
        placeholder="Full name"
        className="w-full border-b-2 border-slate-300 bg-transparent px-1 pb-1 text-center text-sm font-black uppercase tracking-wide text-slate-800 outline-none focus:border-[#2563EB]"
      />
      <input
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder="Designation"
        className="mt-1 w-full bg-transparent px-1 text-center text-xs font-semibold text-slate-500 outline-none"
      />
    </div>
  );
}

function roleTitle(role: string): string {
  const map: Record<string, string> = {
    DOCTOR: "Physician",
    NURSE: "Nurse",
    MIDWIFE: "Midwife",
    BHW: "Barangay Health Worker",
    PHARMACIST: "Pharmacist",
    MEDTECH: "Medical Technologist",
    NUTRITIONIST: "Nutritionist",
    BARANGAY_ADMIN: "Barangay Health Center Admin",
    SUPER_ADMIN: "System Administrator",
  };
  return map[role] ?? "";
}

type ReportMeta = {
  period: string;
  preparedBy: string;
  preparedByTitle: string;
  notedBy: string;
  notedByTitle: string;
};

// --- Excel (.xlsx) export, styled to the DOH BHS Summary Table format ---

const XL_FONT = "Calibri";
const FILL_HEADER = "FFF2F2F2"; // light grey header band
const FILL_SECTION = "FFFCE4D6"; // peach section rows (DOH style)
const BORDER = "FFBFBFBF";

type CellStyle = {
  bold?: boolean;
  italic?: boolean;
  size?: number;
  color?: string;
  align?: "left" | "center" | "right";
  fill?: string;
  indent?: number;
  wrap?: boolean;
};

function styleCell(cell: Cell, s: CellStyle) {
  cell.font = {
    name: XL_FONT,
    size: s.size ?? 11,
    bold: s.bold,
    italic: s.italic,
    color: s.color ? { argb: s.color } : undefined,
  };
  cell.alignment = {
    horizontal: s.align ?? "left",
    vertical: "middle",
    indent: s.indent,
    wrapText: s.wrap,
  };
  if (s.fill) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: s.fill } };
  }
}

async function buildWorkbook(
  current: (typeof REPORTS)[number],
  data: ReportData,
  meta: ReportMeta
): Promise<ArrayBuffer> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Summary Table");

  const mode = current.columns;
  const subCols =
    mode === "fp"
      ? ["NA", "OA", "DO", "CU"]
      : mode === "ncd"
      ? ["M", "F", "T"]
      : ["10-14", "15-19", "20-49", "TOTAL"];
  const n = subCols.length;
  const lastCol = 1 + n;

  const valuesFor = (row: Row): number[] => {
    if (mode === "fp") return [row.na ?? 0, row.oa ?? 0, row.do ?? 0, row.cu ?? 0];
    if (mode === "ncd") return [row.m ?? 0, row.f ?? 0, row.t ?? 0];
    return [row.b1014 ?? 0, row.b1519 ?? 0, row.b2049 ?? 0, row.total ?? 0];
  };

  ws.getColumn(1).width = 58;
  for (let c = 2; c <= lastCol; c++) ws.getColumn(c).width = 11;

  let r = 1;

  // Title band
  ws.mergeCells(r, 1, r, lastCol);
  ws.getCell(r, 1).value = "Summary Table";
  styleCell(ws.getCell(r, 1), { bold: true, size: 16, align: "center", fill: FILL_HEADER });
  ws.getRow(r).height = 26;
  r++;

  ws.mergeCells(r, 1, r, lastCol);
  ws.getCell(r, 1).value = current.title;
  styleCell(ws.getCell(r, 1), { bold: true, size: 12, align: "center" });
  r++;

  ws.mergeCells(r, 1, r, lastCol);
  ws.getCell(r, 1).value = current.subtitle;
  styleCell(ws.getCell(r, 1), { italic: true, size: 9, align: "center", color: "FF666666" });
  r += 2; // subtitle + blank

  const metaRow = (label: string, val: string | number) => {
    ws.getCell(r, 1).value = label;
    styleCell(ws.getCell(r, 1), { bold: true });
    ws.mergeCells(r, 2, r, lastCol);
    ws.getCell(r, 2).value = val;
    styleCell(ws.getCell(r, 2), {});
    r++;
  };
  metaRow("Coverage", data.scope);
  metaRow("Reporting Period", meta.period);
  metaRow(current.countLabel, data.totalRecords);
  metaRow("Generated", new Date().toLocaleString());
  r++; // blank

  // Header (2 rows): INDICATORS (merged down) + period group over sub-columns
  const tableStart = r;
  const hdr1 = r;
  const hdr2 = r + 1;
  ws.mergeCells(hdr1, 1, hdr2, 1);
  ws.getCell(hdr1, 1).value = mode === "fp" ? "METHOD / INDICATOR" : "INDICATORS";
  styleCell(ws.getCell(hdr1, 1), { bold: true, align: "center", fill: FILL_HEADER });
  ws.mergeCells(hdr1, 2, hdr1, lastCol);
  ws.getCell(hdr1, 2).value = String(meta.period || "").toUpperCase();
  styleCell(ws.getCell(hdr1, 2), { bold: true, align: "center", fill: FILL_HEADER });
  subCols.forEach((s, i) => {
    const cell = ws.getCell(hdr2, 2 + i);
    cell.value = s;
    styleCell(cell, { bold: true, align: "center", fill: FILL_HEADER });
  });
  ws.getRow(hdr1).height = 18;
  ws.getRow(hdr2).height = 18;
  r = hdr2 + 1;

  // Data rows
  for (const row of data.rows) {
    const cellA = ws.getCell(r, 1);
    if (row.header) {
      ws.mergeCells(r, 1, r, lastCol);
      cellA.value = row.label;
      styleCell(cellA, { bold: true, fill: FILL_SECTION, align: "left" });
    } else if (!row.isData) {
      ws.mergeCells(r, 1, r, lastCol);
      cellA.value = row.label;
      styleCell(cellA, { bold: true, align: "left" });
    } else {
      cellA.value = row.label;
      styleCell(cellA, { align: "left", indent: row.indent ?? 0, wrap: true });
      valuesFor(row).forEach((v, i) => {
        const c = ws.getCell(r, 2 + i);
        c.value = v;
        styleCell(c, { align: "center", bold: i === n - 1 });
      });
    }
    r++;
  }
  const tableEnd = r - 1;

  // Borders across the whole table region (header + data), incl. merged cells
  const thin = { style: "thin" as const, color: { argb: BORDER } };
  for (let rr = tableStart; rr <= tableEnd; rr++) {
    for (let cc = 1; cc <= lastCol; cc++) {
      ws.getCell(rr, cc).border = { top: thin, left: thin, bottom: thin, right: thin };
    }
  }

  r += 2; // blank spacer

  // Signatories
  const sig = (role: string, name: string, title: string) => {
    ws.getCell(r, 1).value = role;
    styleCell(ws.getCell(r, 1), { bold: true });
    ws.mergeCells(r, 2, r, lastCol);
    ws.getCell(r, 2).value = name;
    styleCell(ws.getCell(r, 2), { bold: true });
    r++;
    ws.mergeCells(r, 2, r, lastCol);
    ws.getCell(r, 2).value = title;
    styleCell(ws.getCell(r, 2), { italic: true, size: 9, color: "FF666666" });
    r++;
  };
  sig("Prepared by:", meta.preparedBy, meta.preparedByTitle);
  sig("Noted by:", meta.notedBy, meta.notedByTitle);

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

function downloadXlsx(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --- PDF export, same DOH Summary Table format as the Excel ---
function buildPdf(
  JsPDF: typeof import("jspdf").jsPDF,
  autoTable: typeof import("jspdf-autotable").default,
  current: (typeof REPORTS)[number],
  data: ReportData,
  meta: ReportMeta
): JsPDFType {
  const mode = current.columns;
  const subCols =
    mode === "fp"
      ? ["NA", "OA", "DO", "CU"]
      : mode === "ncd"
      ? ["M", "F", "T"]
      : ["10-14", "15-19", "20-49", "TOTAL"];
  const n = subCols.length;
  const valuesFor = (row: Row): number[] => {
    if (mode === "fp") return [row.na ?? 0, row.oa ?? 0, row.do ?? 0, row.cu ?? 0];
    if (mode === "ncd") return [row.m ?? 0, row.f ?? 0, row.t ?? 0];
    return [row.b1014 ?? 0, row.b1519 ?? 0, row.b2049 ?? 0, row.total ?? 0];
  };

  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  let y = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Summary Table", pageW / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(11);
  doc.text(current.title, pageW / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(110);
  doc.text(current.subtitle, pageW / 2, y, { align: "center" });
  y += 6;
  doc.setTextColor(20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  for (const line of [
    `Coverage: ${data.scope}`,
    `Reporting Period: ${meta.period}`,
    `${current.countLabel}: ${data.totalRecords}`,
    `Generated: ${new Date().toLocaleString()}`,
  ]) {
    doc.text(line, margin, y);
    y += 4.5;
  }
  y += 2;

  const head = [
    [
      {
        content: mode === "fp" ? "METHOD / INDICATOR" : "INDICATORS",
        rowSpan: 2,
        styles: { valign: "middle", halign: "center" },
      },
      { content: String(meta.period || "").toUpperCase(), colSpan: n, styles: { halign: "center" } },
    ],
    subCols.map((s) => ({ content: s, styles: { halign: "center" } })),
  ];

  const body: unknown[] = [];
  for (const row of data.rows) {
    if (row.header) {
      body.push([{ content: row.label, colSpan: n + 1, styles: { fontStyle: "bold", fillColor: [252, 228, 214] } }]);
    } else if (!row.isData) {
      body.push([{ content: row.label, colSpan: n + 1, styles: { fontStyle: "bold", fillColor: [245, 245, 245] } }]);
    } else {
      const indent = "    ".repeat(row.indent ?? 0);
      const vals = valuesFor(row);
      body.push([
        { content: indent + row.label },
        ...vals.map((v, i) => ({
          content: String(v),
          styles: { halign: "center", fontStyle: i === n - 1 ? "bold" : "normal" },
        })),
      ]);
    }
  }

  const valW = 18;
  const colStyles: Record<number, { cellWidth: number; halign: "left" | "center" }> = {
    0: { cellWidth: pageW - margin * 2 - n * valW, halign: "left" },
  };
  for (let i = 1; i <= n; i++) colStyles[i] = { cellWidth: valW, halign: "center" };

  autoTable(doc, {
    startY: y,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    head: head as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: body as any,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 1.3,
      lineColor: [191, 191, 191],
      lineWidth: 0.1,
      textColor: [20, 20, 20],
      valign: "middle",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [242, 242, 242],
      textColor: [20, 20, 20],
      fontStyle: "bold",
      halign: "center",
      lineColor: [191, 191, 191],
      lineWidth: 0.1,
    },
    columnStyles: colStyles,
    margin: { left: margin, right: margin },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let yEnd = ((doc as any).lastAutoTable?.finalY ?? y) + 12;
  if (yEnd > pageH - 30) {
    doc.addPage();
    yEnd = 20;
  }

  const colW = (pageW - margin * 2) / 2;
  const sig = (x: number, role: string, name: string, title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(20);
    doc.text(role, x, yEnd);
    doc.setFontSize(10);
    doc.text(name || "__________________________", x, yEnd + 8);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(title || "", x, yEnd + 12.5);
  };
  sig(margin, "Prepared by:", meta.preparedBy, meta.preparedByTitle);
  sig(margin + colW, "Noted by:", meta.notedBy, meta.notedByTitle);

  return doc;
}
