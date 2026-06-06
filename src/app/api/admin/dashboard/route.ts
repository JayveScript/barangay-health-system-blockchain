import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canManageBarangay, getCurrentApiUser } from "@/lib/tenant-auth";

export async function GET() {
  try {
    const user = await getCurrentApiUser();

    const barangayId = user?.barangayId;

    if (!canManageBarangay(user) || !barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const residents = await db.resident.findMany({
      where: {
        barangayId,
      },
      include: {
        user: true,
        barangay: true,
        medicalHistory: true,
        familyHistory: true,
        personalSocialHistory: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const staffUsers = await db.user.findMany({
      where: {
        barangayId,
        role: {
          in: ["STAFF", "DOCTOR", "BHW", "NURSE", "MIDWIFE"],
        },
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
        createdAt: true,
        barangay: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalResidents = residents.length;
    const totalStaff = staffUsers.length;
    const totalVerifiedResidents = residents.filter(
  (resident: { user?: { isVerified?: boolean } | null }) =>
    resident.user?.isVerified
).length;

    return NextResponse.json({
      stats: {
        totalResidents,
        totalStaff,
        totalVerifiedResidents,
      },
      residents,
      staffUsers,
      barangay: user.barangay,
    });
  } catch (error) {
    console.error("ADMIN_DASHBOARD_ERROR", error);
    return NextResponse.json(
      { error: "Failed to load admin dashboard." },
      { status: 500 }
    );
  }
}
