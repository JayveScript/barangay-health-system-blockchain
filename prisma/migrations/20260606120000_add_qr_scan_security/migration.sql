-- CreateEnum
CREATE TYPE "QrScanAction" AS ENUM ('SCAN_INITIATED', 'ACCESS_GRANTED', 'ACCESS_DENIED', 'OTP_SENT', 'OTP_FAILED', 'SESSION_EXPIRED');

-- CreateTable
CREATE TABLE "QrScanAuditLog" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "scannedById" TEXT NOT NULL,
    "action" "QrScanAction" NOT NULL,
    "role" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QrScanAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrOtpSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QrOtpSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QrScanAuditLog_residentId_idx" ON "QrScanAuditLog"("residentId");

-- CreateIndex
CREATE INDEX "QrScanAuditLog_scannedById_idx" ON "QrScanAuditLog"("scannedById");

-- CreateIndex
CREATE INDEX "QrScanAuditLog_createdAt_idx" ON "QrScanAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "QrOtpSession_userId_idx" ON "QrOtpSession"("userId");

-- CreateIndex
CREATE INDEX "QrOtpSession_expiresAt_idx" ON "QrOtpSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "QrScanAuditLog" ADD CONSTRAINT "QrScanAuditLog_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrOtpSession" ADD CONSTRAINT "QrOtpSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
