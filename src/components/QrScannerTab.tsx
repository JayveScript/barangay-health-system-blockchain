"use client";

import React, { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { QrCode, AlertCircle, CheckCircle2, Lock, Shield } from "lucide-react";
import { normalizeScannedQrUrl } from "@/lib/normalize-qr-url";

export function QrScannerTab() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleScan = (text: string) => {
    if (text) {
      setSuccess("QR detected! Opening secure verification...");
      setError(null);

      setTimeout(() => {
        const normalized = normalizeScannedQrUrl(text, window.location.origin);
        if (normalized) {
          window.location.href = normalized;
          return;
        }
        setSuccess(null);
        setError("Unrecognized QR code. Please scan a valid resident Digital ID.");
      }, 900);
    }
  };

  const handleError = (error: unknown) => {
    console.error("QR Scanner Error:", error);

    if (error instanceof Error) {
      if (error.name === "NotAllowedError") {
        setError("Camera permission denied. Please allow camera access in your browser settings and reload.");
      } else if (error.name === "NotFoundError") {
        setError("No camera device found on this device.");
      } else if (error.name === "NotReadableError") {
        setError("Camera is in use by another app. Please close other apps using the camera.");
      } else if (error.name === "OverconstrainedError") {
        setError("Camera constraints not supported. Try using a different browser.");
      } else {
        setError(`Camera error: ${error.message || error.name}`);
      }
    } else {
      setError("Unable to access camera. Make sure you are on HTTPS and have granted camera permission.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-[32px] border border-[#E5E7EB] bg-white shadow-xl">
        <div className="border-b border-[#E5E7EB] bg-gradient-to-r from-blue-50 to-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-[20px] bg-blue-100 text-blue-600 shadow-sm ring-1 ring-blue-200">
            <QrCode className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Scan Resident QR</h2>
          <p className="mt-2 text-sm text-slate-500">
            Point your camera at the resident&apos;s Digital ID QR code. You will verify your password before any health data is shown.
          </p>
          <div className="mt-3 flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-wider text-blue-600">
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> AES-256</span>
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> RBAC</span>
          </div>
        </div>

        <div className="relative bg-black">
          <div className="aspect-square w-full">
            {!success ? (
              <Scanner
                onScan={(result) => {
                  if (result && result.length > 0) {
                    handleScan(result[0].rawValue);
                  }
                }}
                onError={handleError}
                constraints={{
                  facingMode: "environment",
                }}
                components={{
                  finder: true,
                }}
                sound={true}
                styles={{
                  container: { width: "100%", height: "100%" },
                  video: { width: "100%", height: "100%", objectFit: "cover" },
                }}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="mb-4 h-16 w-16 animate-bounce" />
                <p className="font-bold">{success}</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="border-t border-red-100 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm font-semibold text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-slate-50 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Powered by Barangay Health Portal
          </p>
        </div>
      </div>
    </div>
  );
}
