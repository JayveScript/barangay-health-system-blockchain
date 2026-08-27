import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";

const ALLOWED_ROLES = ["DOCTOR", "NURSE", "BHW", "MIDWIFE", "PHARMACIST", "MEDTECH", "NUTRITIONIST", "SUPER_ADMIN", "BARANGAY_ADMIN"];

export async function GET() {
  try {
    const user = await getCurrentApiUser();
    if (!user || !ALLOWED_ROLES.includes(String(user.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const residents = await prisma.resident.findMany({
      where: {
        isArchived: false,
        ...(isSuperAdmin(user) ? {} : { barangayId: user.barangayId ?? undefined }),
      },
      include: {
        user: {
          select: { username: true, email: true, isVerified: true, phoneNumber: true },
        },
        medicalHistory: true,
        familyHistory: true,
        personalSocialHistory: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(residents);
  } catch (err) {
    console.error("STAFF_RESIDENTS_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
