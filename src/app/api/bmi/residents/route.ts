import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth";

async function getApiUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const payload = verifyAuthToken(token);
    return await db.user.findUnique({
      where: { id: payload.userId },
      include: { barangay: true },
    });
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user || !["BHW", "STAFF", "NURSE"].includes(String(user.role))) {
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
