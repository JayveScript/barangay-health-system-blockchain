/**
 * auth-edge.ts
 *
 * Edge-safe JWT utilities that rely ONLY on the Web Crypto API (SubtleCrypto).
 * `jsonwebtoken` uses native Node.js crypto and cannot run in middleware
 * (Edge Runtime). This module is the drop-in used by middleware.ts instead.
 */

export type AuthTokenPayload = {
  userId: string;
  username?: string; // optional — the login route only puts userId + role in the JWT
  role: string;
};

/**
 * All roles that are allowed to view a resident's scanned QR profile.
 * These must match the Prisma Role enum values stored in the JWT by /api/login.
 */
export const SCANNER_ALLOWED_ROLES = new Set([
  // Prisma enum values (SCREAMING_SNAKE_CASE) — what the JWT actually contains
  "BARANGAY_ADMIN",
  "SUPER_ADMIN",
  "NURSE",
  "MIDWIFE",
  "DOCTOR",
  "BHW",
]);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function base64UrlDecode(str: string): Uint8Array<ArrayBuffer> {
  // Convert base64url → base64 → binary
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  // Use new Uint8Array(ArrayBuffer) so the .buffer type is exactly ArrayBuffer,
  // which satisfies SubtleCrypto.verify()'s BufferSource parameter in TS 5.x.
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Verifies a HS256 JWT using the Web Crypto API.
 * Returns the decoded payload, or null if invalid / expired.
 */
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

    // Check expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    return { userId: payload.userId, username: payload.username ?? "", role: payload.role };
  } catch {
    return null;
  }
}
