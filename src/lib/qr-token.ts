import crypto from "crypto";

function getSecret(): string {
  const secret = process.env.QR_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("QR token secret is missing (QR_ENCRYPTION_KEY / JWT_SECRET).");
  }
  return secret;
}

export function signResidentQrToken(residentId: string, ttlSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${residentId}.${exp}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return Buffer.from(`${payload}.${sig}`, "utf8").toString("base64url");
}

export function verifyResidentQrToken(token: string): { residentId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 3) return null;

    const [residentId, expStr, sig] = parts;
    const payload = `${residentId}.${expStr}`;
    const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");

    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Math.floor(Date.now() / 1000) > exp) return null;

    return { residentId };
  } catch {
    return null;
  }
}
