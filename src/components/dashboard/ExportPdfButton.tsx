"use client";

import { Download } from "lucide-react";

// Opens the browser's print dialog so the user can Save as PDF. The global
// `@media print` rules (globals.css) hide everything except the nearest
// `.print-area` container, so only the overview is exported. Marked `no-print`
// so the button itself never appears in the PDF.
export function ExportPdfButton({
  label = "Download PDF",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`no-print inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-bold text-sky-700 shadow-sm transition hover:bg-sky-50 ${className}`}
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
