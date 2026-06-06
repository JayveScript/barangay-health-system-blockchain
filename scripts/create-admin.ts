import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  createBarangayAdmin,
  CreateBarangayAdminError,
} from "../src/lib/barangay-admin-service";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const db = new PrismaClient({ adapter });

function readArg(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function requiredArg(name: string) {
  const value = readArg(name)?.trim();
  if (!value) {
    throw new Error(`Missing required argument --${name}=...`);
  }
  return value;
}

async function main() {
  const username = requiredArg("username");
  const password = requiredArg("password");
  const barangayName = requiredArg("barangay-name");
  const municipality = readArg("municipality")?.trim() || null;
  const fullName = readArg("full-name")?.trim() || barangayName;
  const email = readArg("email")?.trim().toLowerCase() || null;

  const result = await createBarangayAdmin(db, {
    username,
    password,
    barangayName,
    municipality,
    fullName,
    email,
  });

  console.log("Barangay admin created successfully.");
  console.log({
    adminId: result.id,
    username: result.username,
    role: result.role,
    barangay: result.barangay,
    initializedWorkspace: result.initializedWorkspace,
  });
}

main()
  .catch((error) => {
    if (error instanceof CreateBarangayAdminError) {
      console.error("CREATE_BARANGAY_ADMIN_ERROR", error.message);
    } else {
      console.error("CREATE_BARANGAY_ADMIN_ERROR", error);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
