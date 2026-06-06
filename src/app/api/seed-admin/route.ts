import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import {
  BARANGAY_ADMIN_USERNAME_SUFFIX,
  isValidBarangayAdminUsername,
} from "@/lib/tenant-auth";

const ADMIN_USERNAME = `main_admin${BARANGAY_ADMIN_USERNAME_SUFFIX}`;
const ADMIN_EMAIL = "main_admin@barangay.com";

export async function GET(req: Request) {
  // Gate with SEED_SECRET — must pass ?secret=<value> matching the env var
  const url = new URL(req.url);
  const provided = url.searchParams.get("secret");
  const expected = process.env.SEED_SECRET;

  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    let barangay = await db.barangay.findFirst({
      where: { name: "Barangay Health Main Office" },
    });

    if (!barangay) {
      barangay = await db.barangay.create({
        data: {
          name: "Barangay Health Main Office",
          municipality: "Main Municipality",
        },
      });
    }

    const existing = await db.user.findFirst({
      where: {
        OR: [
          { username: ADMIN_USERNAME },
          { email: ADMIN_EMAIL },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Admin already exists.",
      });
    }

    if (!isValidBarangayAdminUsername(ADMIN_USERNAME)) {
      return NextResponse.json(
        { error: "Barangay admin username must end with @barangay.hcms." },
        { status: 400 }
      );
    }

    const passwordHash = await hash("admin12345", 10);

    const admin = await db.user.create({
      data: {
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: passwordHash,
        role: "BARANGAY_ADMIN",
        isVerified: true,
        barangayId: barangay.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin created successfully.",
      adminId: admin.id,
    });
  } catch (error) {
    console.error("SEED_ADMIN_ERROR", error);
    return NextResponse.json(
      { error: "Failed to create admin." },
      { status: 500 }
    );
  }
}
