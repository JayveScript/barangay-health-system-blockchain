import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createBarangayAdmin } from "../src/lib/barangay-admin-service";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const REMOVE_NAMES = ["Barangay 19-B", "Barangay 20"];

const NEW_SITIOS: { barangayName: string; username: string; password: string }[] = [
  { barangayName: "Panaga, Brgy. Colosas",         username: "panaga@barangay.hcms",        password: "panaga12345" },
  { barangayName: "Colosas Proper, Brgy. Colosas", username: "colosasproper@barangay.hcms", password: "colosasproper12345" },
  { barangayName: "Surayan, Brgy. Colosas",        username: "surayan@barangay.hcms",       password: "surayan12345" },
  { barangayName: "Monteflor, Brgy. Colosas",      username: "monteflor@barangay.hcms",     password: "monteflor12345" },
  { barangayName: "Galacia, Brgy. Colosas",        username: "galacia@barangay.hcms",       password: "galacia12345" },
  { barangayName: "Apalili, Brgy. Colosas",        username: "apalili@barangay.hcms",       password: "apalili12345" },
];

const MUNICIPALITY = "Davao City";

async function main() {
  // 1. Resolve the barangays to remove.
  const toRemove = await db.barangay.findMany({ where: { name: { in: REMOVE_NAMES } } });
  const ids = toRemove.map((b) => b.id);
  console.log("Removing barangays:", toRemove.map((b) => `${b.name} (${b.id})`).join(", ") || "(none found)");

  if (ids.length > 0) {
    // 2. Delete every dependent record, then residents, users, and the barangay.
    await db.$transaction([
      db.diagnosis.deleteMany({ where: { barangayId: { in: ids } } }),
      db.bMIRecord.deleteMany({ where: { barangayId: { in: ids } } }),
      db.appointment.deleteMany({ where: { barangayId: { in: ids } } }),
      db.doctorAvailability.deleteMany({ where: { barangayId: { in: ids } } }),
      db.residentReferral.deleteMany({
        where: { OR: [{ sourceBarangayId: { in: ids } }, { targetBarangayId: { in: ids } }] },
      }),
      db.announcement.deleteMany({ where: { barangayId: { in: ids } } }),
      db.healthCenterLogbook.deleteMany({ where: { barangayId: { in: ids } } }),
      db.residentMedicalHistory.deleteMany({ where: { barangayId: { in: ids } } }),
      db.residentFamilyHistory.deleteMany({ where: { barangayId: { in: ids } } }),
      db.residentPersonalSocialHistory.deleteMany({ where: { barangayId: { in: ids } } }),
      db.pendingRegistration.deleteMany({ where: { barangayId: { in: ids } } }),
      db.resident.deleteMany({ where: { barangayId: { in: ids } } }),
      db.user.deleteMany({ where: { barangayId: { in: ids } } }),
      db.barangay.deleteMany({ where: { id: { in: ids } } }),
    ]);
    console.log("Deleted old barangays and all dependent data.");
  }

  // 3. Create the 6 sitios, each with its barangay-admin account.
  for (const s of NEW_SITIOS) {
    const existing = await db.barangay.findFirst({ where: { name: s.barangayName } });
    if (existing) {
      console.log(`SKIP  ${s.barangayName} — already exists`);
      continue;
    }
    const admin = await createBarangayAdmin(db, {
      username: s.username,
      password: s.password,
      barangayName: s.barangayName,
      municipality: MUNICIPALITY,
      fullName: s.barangayName,
    });
    console.log(`DONE  ${s.barangayName}  ->  ${s.username}  (adminId=${admin.id})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
