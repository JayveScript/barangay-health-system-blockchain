-- CreateTable
CREATE TABLE "ResidentReferral" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "referredByStaffId" TEXT NOT NULL,
    "sourceBarangayId" TEXT NOT NULL,
    "targetBarangayId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "notes" TEXT,
    "identifyingData" JSONB NOT NULL,
    "medicalHistory" JSONB,
    "familyHistory" JSONB,
    "personalSocialHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResidentReferral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResidentReferral_residentId_idx" ON "ResidentReferral"("residentId");

-- CreateIndex
CREATE INDEX "ResidentReferral_sourceBarangayId_idx" ON "ResidentReferral"("sourceBarangayId");

-- CreateIndex
CREATE INDEX "ResidentReferral_targetBarangayId_idx" ON "ResidentReferral"("targetBarangayId");

-- CreateIndex
CREATE INDEX "ResidentReferral_referredByStaffId_idx" ON "ResidentReferral"("referredByStaffId");

-- AddForeignKey
ALTER TABLE "ResidentReferral" ADD CONSTRAINT "ResidentReferral_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentReferral" ADD CONSTRAINT "ResidentReferral_referredByStaffId_fkey" FOREIGN KEY ("referredByStaffId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentReferral" ADD CONSTRAINT "ResidentReferral_sourceBarangayId_fkey" FOREIGN KEY ("sourceBarangayId") REFERENCES "Barangay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentReferral" ADD CONSTRAINT "ResidentReferral_targetBarangayId_fkey" FOREIGN KEY ("targetBarangayId") REFERENCES "Barangay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
