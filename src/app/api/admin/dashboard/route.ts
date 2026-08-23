import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  canManageBarangay,
  getCurrentApiUser,
  resolveScopeBarangayId,
} from "@/lib/tenant-auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentApiUser();

    if (!canManageBarangay(user) || !user?.barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestedBarangayId = new URL(req.url).searchParams.get("barangayId");
    const barangayId = resolveScopeBarangayId(user, requestedBarangayId);

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
          in: ["DOCTOR", "BHW", "NURSE", "MIDWIFE", "PHARMACIST", "MEDTECH", "NUTRITIONIST"],
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

    // The barangay actually being viewed (own, or the one a super-admin picked).
    const barangay =
      barangayId === user.barangayId
        ? user.barangay
        : await db.barangay.findUnique({ where: { id: barangayId } });

    return NextResponse.json({
      stats: {
        totalResidents,
        totalStaff,
        totalVerifiedResidents,
      },
      residents,
      staffUsers,
      barangay,
    });
  } catch (error) {
    console.error("ADMIN_DASHBOARD_ERROR", error);
    return NextResponse.json(
      { error: "Failed to load admin dashboard." },
      { status: 500 }
    );
  }
}
