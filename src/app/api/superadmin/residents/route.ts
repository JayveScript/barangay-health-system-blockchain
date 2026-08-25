import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";

export async function GET() {
  try {
    const user = await getCurrentApiUser();
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const residents = await db.resident.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        age: true,
        sex: true,
        contactNumber: true,
        barangayName: true,
        createdAt: true,
        user: { select: { isVerified: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json({ residents });
  } catch (error) {
    console.error("SUPERADMIN_RESIDENTS_ERROR", error);
    return NextResponse.json(
      { error: "Failed to load residents." },
      { status: 500 }
    );
  }
}
