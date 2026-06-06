# BHCMS Multi-Tenancy Migration Plan

## Tenant Model

- `Barangay` is the tenant root.
- Tenant-owned records carry `barangayId`.
- `User` and `Resident` already have required `barangayId` links.
- The tenant migration adds/backfills required `barangayId` links for:
  - `PendingRegistration`
  - `ResidentMedicalHistory`
  - `ResidentFamilyHistory`
  - `ResidentPersonalSocialHistory`
  - `DoctorAvailability`
  - `Appointment`
  - `Announcement`

## Safe Migration Order

1. Create or locate the existing legacy barangay tenant.
2. Add new `barangayId` columns as nullable.
3. Backfill existing rows from their owning resident/user where possible.
4. Fall back to the legacy barangay tenant for remaining existing rows.
5. Make `barangayId` required.
6. Add foreign keys and tenant indexes.
7. Add the Barangay Admin username check constraint.

The current Prisma schema uses text UUID tenant IDs, so the legacy tenant is not forced to integer `1`. The important invariant is that all existing rows are assigned to one known legacy `Barangay.id` before `NOT NULL` is enforced.

## Resident Registration Tenant Choice

Resident self-registration only allows the configured barangay choices in `src/lib/barangay-options.ts`.

- `BARANGAY 19-B` stores the pending registration, user, resident profile, histories, and appointments under the Barangay 19-B tenant.
- `BARANGAY 20` stores the same records under the Barangay 20 tenant.

The verification step must use the `barangayId`, `barangayName`, and `city` captured in `PendingRegistration`; it must not overwrite the resident back to a static barangay.

## New Barangay Admin Creation

Use the CLI script:

```bash
npm run create:barangay-admin -- --username=central_admin@barangay.hcms --password=change-this-password --barangay-name="Central Barangay" --municipality="Davao City" --full-name="Central Barangay Admin" --email=central_admin@example.com
```

This creates:

- one new `Barangay`
- one verified `BARANGAY_ADMIN` user linked to that barangay
- zero residents
- zero staff users
- zero appointments
- zero announcements

The existing Barangay Admin tenant is not updated by this script.

## Backend Isolation Rule

Every tenant data query must include the logged-in user's `barangayId`, except intentional `SUPER_ADMIN` operations. Staff creation, resident mutation, resident appointment booking, doctor dashboards, BHW appointment views, and announcements are scoped by `barangayId`.

## Username Validation

Use the shared constants from `src/lib/username-validation.ts`.

```ts
const BARANGAY_ADMIN_USERNAME_REGEX = /^[a-z0-9._-]+@barangay\.hcms$/i;
```

The same suffix rule is enforced by the Barangay Admin service, CLI, API route, and database check constraint for new/updated Barangay Admin rows. The Admin Dashboard staff/user creation endpoint also normalizes local usernames to this suffix and rejects any new staff, doctor, nurse, BHW, or midwife username that does not match the same pattern.
