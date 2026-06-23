import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

// Target usernames following the @barangay.hcms convention.
const UPDATES: { barangay: string; role: string; username: string }[] = [
  { barangay: "Barangay 19-B", role: "STAFF", username: "staff1@barangay.hcms" },
  { barangay: "Barangay 19-B", role: "DOCTOR", username: "doctor1@barangay.hcms" },
  { barangay: "Barangay 19-B", role: "NURSE", username: "nurse1@barangay.hcms" },
  { barangay: "Barangay 19-B", role: "BHW", username: "bhw1@barangay.hcms" },
  { barangay: "Barangay 20", role: "STAFF", username: "staff2@barangay.hcms" },
  { barangay: "Barangay 20", role: "DOCTOR", username: "doctor2@barangay.hcms" },
  { barangay: "Barangay 20", role: "NURSE", username: "nurse2@barangay.hcms" },
  { barangay: "Barangay 20", role: "BHW", username: "bhw2@barangay.hcms" },
];

async function main() {
  for (const target of UPDATES) {
    const barangay = await db.barangay.findFirst({
      where: { name: target.barangay },
    });

    if (!barangay) {
      console.log(`SKIP  ${target.username} — barangay "${target.barangay}" not found`);
      continue;
    }

    const users = await db.user.findMany({
      where: { barangayId: barangay.id, role: target.role as never },
    });

    if (users.length === 0) {
      console.log(`SKIP  ${target.username} — no ${target.role} in ${target.barangay}`);
      continue;
    }

    if (users.length > 1) {
      console.log(
        `SKIP  ${target.username} — ${users.length} ${target.role} users in ${target.barangay} (ambiguous): ${users
          .map((u) => u.username)
          .join(", ")}`
      );
      continue;
    }

    const user = users[0];

    if (user.username === target.username) {
      console.log(`OK    ${target.username} — already correct`);
      continue;
    }

    // Guard against colliding with an unrelated account.
    const clash = await db.user.findUnique({ where: { username: target.username } });
    if (clash && clash.id !== user.id) {
      console.log(`SKIP  ${target.username} — already taken by another account (id=${clash.id})`);
      continue;
    }

    await db.user.update({
      where: { id: user.id },
      data: { username: target.username },
    });

    console.log(`DONE  ${user.username}  ->  ${target.username}  (${target.role}, ${target.barangay})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
