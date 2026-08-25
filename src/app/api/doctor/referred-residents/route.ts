import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentApiUser } from "@/lib/tenant-auth";

export async function GET() {
  try {
    const user = await getCurrentApiUser();

    if (!user || String(user.role) !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const referrals = await db.residentReferral.findMany({
      where: { targetBarangayId: user.barangayId },
      include: {
        sourceBarangay: true,
        targetBarangay: true,
        referredByStaff: {
          select: { id: true, fullName: true, username: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ referrals });
  } catch (error) {
    console.error("DOCTOR_REFERRED_RESIDENTS_GET_ERROR", error);
    return NextResponse.json(
      { error: "Failed to load referred residents." },
      { status: 500 }
    );
  }
}
