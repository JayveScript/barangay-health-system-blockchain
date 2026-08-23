import { NextResponse } from "next/server";
import { resolveAuthedUser } from "@/lib/api-auth";
import { db } from "@/lib/db";

async function getApiUser() {
  return resolveAuthedUser({ barangay: true });
}

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user || !["BHW", "NURSE", "MEDTECH", "NUTRITIONIST"].includes(String(user.role))) {
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
      },
      orderBy: { lastName: "asc" },
    });

    return NextResponse.json(residents);
  } catch (err) {
    console.error("BMI_RESIDENTS_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
