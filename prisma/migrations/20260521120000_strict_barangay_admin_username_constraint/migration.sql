-- Tighten the Barangay Admin username convention at the database layer.
-- NOT VALID preserves any pre-existing legacy admin rows; new inserts and
-- updates must match the exact suffix/prefix format enforced by the app.

ALTER TABLE "User"
  DROP CONSTRAINT IF EXISTS "User_barangay_admin_username_suffix_chk";

ALTER TABLE "User"
  ADD CONSTRAINT "User_barangay_admin_username_suffix_chk"
  CHECK (
    "role" <> 'BARANGAY_ADMIN'
    OR lower("username") ~ '^[a-z0-9._-]+@barangay\.hcms$'
  )
  NOT VALID;
