import jwt from "jsonwebtoken";

export const QR_ACCESS_SESSION_MINUTES = 15;

export type QrAccessPayload = {
  userId: string;
  residentId: string;
  role: string;
  type: "qr_access";
};

function getJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.npm_lifecycle_event === "build") {
    return "__build_placeholder__";
  }

  throw new Error("JWT_SECRET is missing. Add it in Vercel Environment Variables.");
}

export function signQrAccessToken(payload: Omit<QrAccessPayload, "type">) {
  return jwt.sign(
    { ...payload, type: "qr_access" as const },
    getJwtSecret(),
    { expiresIn: `${QR_ACCESS_SESSION_MINUTES}m` }
  );
}

export function verifyQrAccessToken(
  token: string,
  expectedResidentId?: string
): QrAccessPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as QrAccessPayload;

    if (payload.type !== "qr_access") return null;
    if (expectedResidentId && payload.residentId !== expectedResidentId) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
