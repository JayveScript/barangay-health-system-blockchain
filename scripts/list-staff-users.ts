import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const ROLES = ["STAFF", "DOCTOR", "NURSE", "BHW", "MIDWIFE"];

async function main() {
  const barangays = await db.barangay.findMany({
    orderBy: { name: "asc" },
    include: {
      users: {
        where: { role: { in: ROLES as never } },
        select: { id: true, fullName: true, username: true, role: true },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  for (const b of barangays) {
    console.log(`\n=== ${b.name} (id=${b.id}) ===`);
    if (b.users.length === 0) {
      console.log("  (no staff/clinical users)");
      continue;
    }
    for (const u of b.users) {
      console.log(`  [${u.role}] ${u.username}   — ${u.fullName ?? "(no name)"}   (id=${u.id})`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
