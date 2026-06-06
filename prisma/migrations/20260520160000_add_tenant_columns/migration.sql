-- Multi-tenancy backfill migration.
-- Add tenant columns as nullable first, assign existing rows to the current
-- barangay, then enforce NOT NULL + foreign keys. This preserves all current
-- residents, staff, appointments, announcements, and pending registrations.

DO $$
DECLARE
  legacy_barangay_id TEXT;
BEGIN
  SELECT "id"
    INTO legacy_barangay_id
    FROM "Barangay"
    ORDER BY "createdAt" ASC
    LIMIT 1;

  IF legacy_barangay_id IS NULL THEN
    legacy_barangay_id := 'legacy-barangay-19b';

    INSERT INTO "Barangay" ("id", "name", "municipality", "createdAt")
    VALUES (legacy_barangay_id, 'Barangay 19-B', 'Davao City', CURRENT_TIMESTAMP);
  END IF;

  ALTER TABLE "PendingRegistration" ADD COLUMN IF NOT EXISTS "barangayId" TEXT;
  ALTER TABLE "ResidentMedicalHistory" ADD COLUMN IF NOT EXISTS "barangayId" TEXT;
  ALTER TABLE "ResidentFamilyHistory" ADD COLUMN IF NOT EXISTS "barangayId" TEXT;
  ALTER TABLE "ResidentPersonalSocialHistory" ADD COLUMN IF NOT EXISTS "barangayId" TEXT;
  ALTER TABLE "DoctorAvailability" ADD COLUMN IF NOT EXISTS "barangayId" TEXT;
  ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "barangayId" TEXT;
  ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "barangayId" TEXT;

  UPDATE "PendingRegistration"
     SET "barangayId" = legacy_barangay_id
   WHERE "barangayId" IS NULL;

  UPDATE "ResidentMedicalHistory" h
     SET "barangayId" = COALESCE(r."barangayId", legacy_barangay_id)
    FROM "Resident" r
   WHERE h."residentId" = r."id"
     AND h."barangayId" IS NULL;

  UPDATE "ResidentMedicalHistory"
     SET "barangayId" = legacy_barangay_id
   WHERE "barangayId" IS NULL;

  UPDATE "ResidentFamilyHistory" h
     SET "barangayId" = COALESCE(r."barangayId", legacy_barangay_id)
    FROM "Resident" r
   WHERE h."residentId" = r."id"
     AND h."barangayId" IS NULL;

  UPDATE "ResidentFamilyHistory"
     SET "barangayId" = legacy_barangay_id
   WHERE "barangayId" IS NULL;

  UPDATE "ResidentPersonalSocialHistory" h
     SET "barangayId" = COALESCE(r."barangayId", legacy_barangay_id)
    FROM "Resident" r
   WHERE h."residentId" = r."id"
     AND h."barangayId" IS NULL;

  UPDATE "ResidentPersonalSocialHistory"
     SET "barangayId" = legacy_barangay_id
   WHERE "barangayId" IS NULL;

  UPDATE "DoctorAvailability" da
     SET "barangayId" = COALESCE(u."barangayId", legacy_barangay_id)
    FROM "User" u
   WHERE da."doctorId" = u."id"
     AND da."barangayId" IS NULL;

  UPDATE "DoctorAvailability"
     SET "barangayId" = legacy_barangay_id
   WHERE "barangayId" IS NULL;

  UPDATE "Appointment" a
     SET "barangayId" = COALESCE(
       r."barangayId",
       (SELECT u."barangayId" FROM "User" u WHERE u."id" = a."doctorId"),
       legacy_barangay_id
     )
    FROM "Resident" r
   WHERE a."residentId" = r."id"
     AND a."barangayId" IS NULL;

  UPDATE "Appointment"
     SET "barangayId" = legacy_barangay_id
   WHERE "barangayId" IS NULL;

  UPDATE "Announcement"
     SET "barangayId" = legacy_barangay_id
   WHERE "barangayId" IS NULL;
END $$;

ALTER TABLE "PendingRegistration" ALTER COLUMN "barangayId" SET NOT NULL;
ALTER TABLE "ResidentMedicalHistory" ALTER COLUMN "barangayId" SET NOT NULL;
ALTER TABLE "ResidentFamilyHistory" ALTER COLUMN "barangayId" SET NOT NULL;
ALTER TABLE "ResidentPersonalSocialHistory" ALTER COLUMN "barangayId" SET NOT NULL;
ALTER TABLE "DoctorAvailability" ALTER COLUMN "barangayId" SET NOT NULL;
ALTER TABLE "Appointment" ALTER COLUMN "barangayId" SET NOT NULL;
ALTER TABLE "Announcement" ALTER COLUMN "barangayId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "PendingRegistration_barangayId_idx" ON "PendingRegistration"("barangayId");
CREATE INDEX IF NOT EXISTS "ResidentMedicalHistory_barangayId_idx" ON "ResidentMedicalHistory"("barangayId");
CREATE INDEX IF NOT EXISTS "ResidentFamilyHistory_barangayId_idx" ON "ResidentFamilyHistory"("barangayId");
CREATE INDEX IF NOT EXISTS "ResidentPersonalSocialHistory_barangayId_idx" ON "ResidentPersonalSocialHistory"("barangayId");
CREATE INDEX IF NOT EXISTS "DoctorAvailability_barangayId_idx" ON "DoctorAvailability"("barangayId");
CREATE INDEX IF NOT EXISTS "DoctorAvailability_doctorId_barangayId_idx" ON "DoctorAvailability"("doctorId", "barangayId");
CREATE INDEX IF NOT EXISTS "Appointment_barangayId_idx" ON "Appointment"("barangayId");
CREATE INDEX IF NOT EXISTS "Appointment_residentId_barangayId_idx" ON "Appointment"("residentId", "barangayId");
CREATE INDEX IF NOT EXISTS "Appointment_doctorId_barangayId_idx" ON "Appointment"("doctorId", "barangayId");
CREATE INDEX IF NOT EXISTS "Announcement_barangayId_publishDate_idx" ON "Announcement"("barangayId", "publishDate");

ALTER TABLE "PendingRegistration"
  ADD CONSTRAINT "PendingRegistration_barangayId_fkey"
  FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResidentMedicalHistory"
  ADD CONSTRAINT "ResidentMedicalHistory_barangayId_fkey"
  FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResidentFamilyHistory"
  ADD CONSTRAINT "ResidentFamilyHistory_barangayId_fkey"
  FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResidentPersonalSocialHistory"
  ADD CONSTRAINT "ResidentPersonalSocialHistory_barangayId_fkey"
  FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DoctorAvailability"
  ADD CONSTRAINT "DoctorAvailability_barangayId_fkey"
  FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_barangayId_fkey"
  FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Announcement"
  ADD CONSTRAINT "Announcement_barangayId_fkey"
  FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enforce the Barangay Admin username convention for new rows/updates while
-- preserving any pre-existing legacy admin username.
ALTER TABLE "User"
  ADD CONSTRAINT "User_barangay_admin_username_suffix_chk"
  CHECK ("role" <> 'BARANGAY_ADMIN' OR lower("username") LIKE '%@barangay.hcms')
  NOT VALID;
