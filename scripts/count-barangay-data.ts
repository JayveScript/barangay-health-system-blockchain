import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
async function main() {
  const bs = await db.barangay.findMany({ orderBy: { name: "asc" } });
  for (const b of bs) {
    const [users, residents, diagnoses, appts, bmi, refsSrc, refsTgt, ann, log] = await Promise.all([
      db.user.count({ where: { barangayId: b.id } }),
      db.resident.count({ where: { barangayId: b.id } }),
      db.diagnosis.count({ where: { barangayId: b.id } }),
      db.appointment.count({ where: { barangayId: b.id } }),
      db.bMIRecord.count({ where: { barangayId: b.id } }),
      db.residentReferral.count({ where: { sourceBarangayId: b.id } }),
      db.residentReferral.count({ where: { targetBarangayId: b.id } }),
      db.announcement.count({ where: { barangayId: b.id } }),
      db.healthCenterLogbook.count({ where: { barangayId: b.id } }),
    ]);
    console.log(`${b.name} (id=${b.id}): users=${users} residents=${residents} diagnoses=${diagnoses} appts=${appts} bmi=${bmi} referrals(src=${refsSrc},tgt=${refsTgt}) announcements=${ann} logbook=${log}`);
  }
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>db.$disconnect());
