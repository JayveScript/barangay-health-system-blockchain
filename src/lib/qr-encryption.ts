import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export type QrPayload = {
  residentId: string;
  barangayId: string;
  issuedAt: number;
  v: number;
};

function getEncryptionKey(): Buffer {
  const secret = process.env.QR_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("QR_ENCRYPTION_KEY or JWT_SECRET must be configured.");
  }

  return createHash("sha256").update(`qr-aes-256:${secret}`).digest();
}

export function encryptQrPayload(payload: QrPayload): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(payload);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

export function decryptQrToken(token: string): QrPayload | null {
  try {
    const key = getEncryptionKey();
    const data = Buffer.from(token, "base64url");

    if (data.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
      return null;
    }

    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");

    const payload = JSON.parse(decrypted) as QrPayload;

    if (!payload.residentId || !payload.barangayId || payload.v !== 1) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function isValidQrToken(token: string): boolean {
  return decryptQrToken(token) !== null;
}
