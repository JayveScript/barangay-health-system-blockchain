
export type AuthTokenPayload = {
  userId: string;
  username?: string;
  role: string;
};

export const SCANNER_ALLOWED_ROLES = new Set([
  "BARANGAY_ADMIN",
  "SUPER_ADMIN",
  "NURSE",
  "MIDWIFE",
  "DOCTOR",
  "BHW",
  "PHARMACIST",
  "MEDTECH",
  "NUTRITIONIST",
]);


function base64UrlDecode(str: string): Uint8Array<ArrayBuffer> {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return view;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
}


export async function verifyAuthTokenEdge(
  token: string
): Promise<AuthTokenPayload | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    const key = await importHmacKey(secret);
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlDecode(signatureB64);

    const valid = await crypto.subtle.verify("HMAC", key, signature, data);
    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payloadB64))
    ) as AuthTokenPayload & { exp?: number };

    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    return { userId: payload.userId, username: payload.username ?? "", role: payload.role };
  } catch {
    return null;
  }
}
