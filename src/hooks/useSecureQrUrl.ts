"use client";

import { useEffect, useState } from "react";
import { buildResidentQrUrl, getQrBaseUrl } from "@/lib/qr-url";

export function useSecureQrUrl(residentId: string, size = 200) {
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [scanUrl, setScanUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = getQrBaseUrl(window.location.origin);
    const url = buildResidentQrUrl(residentId, base);

    setScanUrl(url);

    const appOnlyToken = `KALYO://resident/${residentId}`;
    setQrImageUrl(
      `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
        appOnlyToken
      )}`
    );
    setLoading(false);
  }, [residentId, size]);

  return { qrImageUrl, loading, scanUrl };
}
