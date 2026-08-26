import { NextResponse } from "next/server";
import { resolveAuthedUser } from "@/lib/api-auth";
import { db } from "@/lib/db";

const ALLOWED_ROLES = ["DOCTOR", "NURSE", "BHW", "MIDWIFE", "PHARMACIST", "MEDTECH", "NUTRITIONIST", "BARANGAY_ADMIN"];

async function getApiUser() {
  return resolveAuthedUser({ barangay: true });
}

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user || !ALLOWED_ROLES.includes(String(user.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const residents = await db.resident.findMany({
      where: { barangayId: user.barangayId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        age: true,
        sex: true,
        medicalHistory: true,
      },
      orderBy: { lastName: "asc" },
    });

    return NextResponse.json(residents);
  } catch (err) {
    console.error("DIAGNOSE_RESIDENTS_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
