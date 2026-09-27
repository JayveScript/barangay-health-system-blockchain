"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";

export function ExportPdfButton({
  label = "Download PDF",
  fileName = "overview",
  className = "",
}: {
  label?: string;
  fileName?: string;
  className?: string;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    if (busy) return;
    setError(null);

    const area = btnRef.current?.closest(".print-area") as HTMLElement | null;
    if (!area) {
      window.print();
      return;
    }

    setBusy(true);
    try {
      const [{ toPng }, jspdfMod] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);
      const JsPDF = jspdfMod.jsPDF;

      const dataUrl = await toPng(area, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        filter: (node) =>
          !(
            node instanceof HTMLElement &&
            node.classList &&
            node.classList.contains("no-print")
          ),
      });

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("capture failed"));
        img.src = dataUrl;
      });

      const pdf = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgW = pageW - margin * 2;
      const imgH = (img.height / img.width) * imgW;

      let position = 0;
      let heightLeft = imgH;
      pdf.addImage(dataUrl, "PNG", margin, position, imgW, imgH);
      heightLeft -= pageH;

      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", margin, position, imgW, imgH);
        heightLeft -= pageH;
      }

      const stamp = new Date().toISOString().slice(0, 10);
      pdf.save(`${fileName}-${stamp}.pdf`);
    } catch (err) {
      console.error("EXPORT_PDF_ERROR", err);
      setError("Couldn't build the PDF. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="no-print inline-flex flex-col items-end">
      <button
        ref={btnRef}
        type="button"
        onClick={download}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-bold text-sky-700 shadow-sm transition hover:bg-sky-50 disabled:opacity-60 ${className}`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {busy ? "Preparing…" : label}
      </button>
      {error && (
        <span className="mt-1 text-xs font-semibold text-red-600">{error}</span>
      )}
    </div>
  );
}
