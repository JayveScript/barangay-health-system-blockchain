export function normalizeScannedQrUrl(
  scannedText: string,
  currentOrigin: string
): string | null {
  const text = (scannedText || "").trim();
  const origin = currentOrigin.replace(/\/$/, "");

  const tokenMatch = text.match(/^KALYO:\/\/resident\/([^/?#\s]+)(\?[^#\s]*)?/i);
  if (tokenMatch) {
    const queryString = tokenMatch[2] || "";
    return `${origin}/resident/${tokenMatch[1]}${queryString}`;
  }

  try {
    const url = new URL(text, currentOrigin);

    if (
      url.pathname.startsWith("/scan") ||
      url.pathname.startsWith("/resident/")
    ) {
      return `${origin}${url.pathname}${url.search}`;
    }

    return null;
  } catch {
    return null;
  }
}
