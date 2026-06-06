import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const QR_ACCESS_SESSION_MINUTES = 15;

export type QrAccessPayload = {
  userId: string;
  residentId: string;
  role: string;
  type: "qr_access";
};

export function signQrAccessToken(payload: Omit<QrAccessPayload, "type">) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing.");
  }

  return jwt.sign(
    { ...payload, type: "qr_access" as const },
    JWT_SECRET,
    { expiresIn: `${QR_ACCESS_SESSION_MINUTES}m` }
  );
}

export function verifyQrAccessToken(
  token: string,
  expectedResidentId?: string
): QrAccessPayload | null {
  if (!JWT_SECRET) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as QrAccessPayload;

    if (payload.type !== "qr_access") return null;
    if (expectedResidentId && payload.residentId !== expectedResidentId) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
