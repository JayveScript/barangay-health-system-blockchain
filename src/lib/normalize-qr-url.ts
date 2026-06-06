/**
 * Rewrites scanned QR URLs to the current deployment origin.
 * Old printed QR codes may still point at a previous Vercel preview URL.
 */
export function normalizeScannedQrUrl(
  scannedText: string,
  currentOrigin: string
): string | null {
  try {
    const url = new URL(scannedText, currentOrigin);

    if (
      url.pathname.startsWith("/scan") ||
      url.pathname.startsWith("/resident/")
    ) {
      return `${currentOrigin.replace(/\/$/, "")}${url.pathname}${url.search}`;
    }

    return null;
  } catch {
    return null;
  }
}
