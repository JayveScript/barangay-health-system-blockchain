import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getScannerUser } from "@/lib/get-scanner-user";
import { decryptQrToken, type QrPayload } from "@/lib/qr-encryption";
import { signQrAccessToken, QR_ACCESS_SESSION_MINUTES } from "@/lib/qr-access";
import { extractRequestMeta, logQrScanActivity } from "@/lib/qr-audit";
import { transporter } from "@/lib/mail";
import { logAuditEvent, AuditEventType } from "@/lib/blockchain";

export async function POST(req: Request) {
  const meta = extractRequestMeta(req);

  try {
    const scanner = await getScannerUser();
    if (!scanner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { qrToken, residentId, password, otpSessionId, otp } = body as {
      qrToken?: string;
      residentId?: string;
      password?: string;
      otpSessionId?: string;
      otp?: string;
    };

    const sessionKey = qrToken || residentId || "";
    const payload = await resolveQrPayload(qrToken, residentId);

    if (!payload) {
      await logQrScanActivity({
        residentId: residentId || "unknown",
        scannedById: scanner.userId,
        role: scanner.role,
        action: "ACCESS_DENIED",
        success: false,
        failureReason: "Invalid or tampered QR token",
        meta,
      });
      return NextResponse.json({ error: "Invalid or tampered QR code" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: scanner.userId },
      select: {
        id: true,
        fullName: true,
        role: true,
        password: true,
        email: true,
        barangayId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN") {
      if (!user.barangayId || user.barangayId !== payload.barangayId) {
        await logQrScanActivity({
          residentId: payload.residentId,
          scannedById: user.id,
          role: user.role,
          action: "ACCESS_DENIED",
          success: false,
          failureReason: !user.barangayId
            ? "User has no barangay assigned"
            : "Cross-barangay access attempt",
          meta,
        });
        return NextResponse.json(
          { error: "Access denied. You can only access residents from your own barangay." },
          { status: 403 }
        );
      }
    }

    if (otpSessionId && otp) {
      const session = await prisma.qrOtpSession.findFirst({
        where: {
          id: otpSessionId,
          userId: user.id,
          residentId: payload.residentId,
          verified: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) {
        await logQrScanActivity({
          residentId: payload.residentId,
          scannedById: user.id,
          role: user.role,
          action: "OTP_FAILED",
          success: false,
          failureReason: "OTP session expired or invalid",
          meta,
        });
        return NextResponse.json({ error: "OTP session expired. Please try again." }, { status: 401 });
      }

      const otpValid = await compare(String(otp), session.otpHash);
      if (!otpValid || session.qrToken !== sessionKey) {
        await logQrScanActivity({
          residentId: payload.residentId,
          scannedById: user.id,
          role: user.role,
          action: "OTP_FAILED",
          success: false,
          failureReason: "Invalid OTP",
          meta,
        });
        return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
      }

      await prisma.qrOtpSession.update({
        where: { id: session.id },
        data: { verified: true },
      });

      return grantAccess(user, payload.residentId, meta);
    }

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const passwordValid = await compare(String(password), user.password);
    if (!passwordValid) {
      await logQrScanActivity({
        residentId: payload.residentId,
        scannedById: user.id,
        role: user.role,
        action: "ACCESS_DENIED",
        success: false,
        failureReason: "Invalid password",
        meta,
      });
      // Blockchain: log denial (fire-and-forget)
      logAuditEvent(
        AuditEventType.QR_SCAN_DENIED,
        user.id,
        payload.residentId,
        user.barangayId,
        null,
        { role: user.role, reason: "invalid_password" }
      ).catch(err => console.error("[blockchain] QR deny log failed:", err));
      return NextResponse.json(
        { error: "Access denied. Incorrect password." },
        { status: 401 }
      );
    }

    // 2FA removed — password verification is sufficient for QR access

    return grantAccess(user, payload.residentId, meta);
  } catch (error) {
    console.error("[qr-scan/verify]", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

async function resolveQrPayload(
  qrToken?: string,
  residentId?: string
): Promise<QrPayload | null> {
  if (qrToken) {
    const decrypted = decryptQrToken(qrToken);
    if (decrypted) return decrypted;
  }

  if (residentId) {
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      select: { id: true, barangayId: true },
    });

    if (resident) {
      return {
        residentId: resident.id,
        barangayId: resident.barangayId,
        issuedAt: Date.now(),
        v: 1,
      };
    }
  }

  return null;
}

async function grantAccess(
  user: { id: string; role: string; barangayId?: string },
  residentId: string,
  meta: ReturnType<typeof extractRequestMeta>
) {
  const accessToken = signQrAccessToken({
    userId: user.id,
    residentId,
    role: user.role,
  });

  await logQrScanActivity({
    residentId,
    scannedById: user.id,
    role: user.role,
    action: "ACCESS_GRANTED",
    success: true,
    meta,
  });

  // ── Blockchain: immutable audit log for access grant (fire-and-forget) ───
  logAuditEvent(
    AuditEventType.QR_SCAN_GRANTED,
    user.id,
    residentId,
    user.barangayId ?? "unknown",
    null,
    { role: user.role }
  ).catch(err => console.error("[blockchain] QR grant log failed:", err));

  const res = NextResponse.json({
    success: true,
    redirectUrl: `/resident/${residentId}`,
    sessionMinutes: QR_ACCESS_SESSION_MINUTES,
  });

  res.cookies.set("qr_access_token", accessToken, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: QR_ACCESS_SESSION_MINUTES * 60,
  });

  return res;
}
