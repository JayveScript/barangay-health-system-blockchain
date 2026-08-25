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
