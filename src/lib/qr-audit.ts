import { QrScanAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditRequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceInfo?: string | null;
};

export async function logQrScanActivity(params: {
  residentId: string;
  scannedById: string;
  role: string;
  action: QrScanAction;
  success: boolean;
  failureReason?: string;
  meta?: AuditRequestMeta;
}) {
  try {
    await prisma.qrScanAuditLog.create({
      data: {
        residentId: params.residentId,
        scannedById: params.scannedById,
        role: params.role,
        action: params.action,
        success: params.success,
        failureReason: params.failureReason,
        ipAddress: params.meta?.ipAddress ?? null,
        userAgent: params.meta?.userAgent ?? null,
        deviceInfo: params.meta?.deviceInfo ?? null,
      },
    });
  } catch (error) {
    console.error("[qr-audit] Failed to write audit log", error);
  }
}

export function extractRequestMeta(req: Request): AuditRequestMeta {
  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip");
  const userAgent = req.headers.get("user-agent");

  let deviceInfo: string | null = null;
  if (userAgent) {
    if (/mobile|android|iphone|ipad/i.test(userAgent)) {
      deviceInfo = "Mobile";
    } else if (/tablet/i.test(userAgent)) {
      deviceInfo = "Tablet";
    } else {
      deviceInfo = "Desktop";
    }
  }

  return { ipAddress, userAgent, deviceInfo };
}
