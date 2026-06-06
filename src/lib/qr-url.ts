/**
 * QR codes contain a direct URL so phone cameras / Safari open the link immediately.
 * Set NEXT_PUBLIC_APP_URL in Vercel after your first deploy so QRs always use your new domain.
 */

export function getQrBaseUrl(clientOrigin?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }

  if (clientOrigin) {
    const origin = clientOrigin.replace(/\/$/, "");
    if (!origin.includes("localhost") && !origin.includes("127.0.0.1")) {
      return origin;
    }
  }

  return "http://localhost:3000";
}

export function getAppBaseUrl(request?: Request): string {
  if (request) {
    const origin = request.headers.get("origin");
    if (origin) return origin.replace(/\/$/, "");

    const host =
      request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}`.replace(/\/$/, "");
  }

  return getQrBaseUrl();
}

export function buildResidentQrUrl(
  residentId: string,
  baseUrl?: string
): string {
  const origin = (baseUrl || getQrBaseUrl()).replace(/\/$/, "");
  return `${origin}/resident/${residentId}`;
}
