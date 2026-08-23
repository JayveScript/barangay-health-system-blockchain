import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";

const STAFF_ROLES = ["DOCTOR", "NURSE", "BHW", "MIDWIFE", "PHARMACIST", "MEDTECH", "NUTRITIONIST"];

// GET /api/superadmin/staff — all clinical/support staff across every barangay.
export async function GET() {
  try {
    const user = await getCurrentApiUser();
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const staff = await db.user.findMany({
      where: { role: { in: STAFF_ROLES as never } },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        barangay: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error("SUPERADMIN_STAFF_ERROR", error);
    return NextResponse.json({ error: "Failed to load staff." }, { status: 500 });
  }
}
