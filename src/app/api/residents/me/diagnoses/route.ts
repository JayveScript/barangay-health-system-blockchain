import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth";

// Returns the logged-in resident's diagnoses, used to attribute each medical
// condition to the staff member who recorded it and when.
async function getApiUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    return await db.user.findUnique({
      where: { id: payload.userId },
      include: { resident: true },
    });
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getApiUser();

    if (!user || String(user.role) !== "RESIDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resident = user.resident;
    if (!resident) {
      return NextResponse.json(
        { error: "Resident profile not found." },
        { status: 404 }
      );
    }

    const diagnoses = await db.diagnosis.findMany({
      where: { residentId: resident.id },
      select: {
        id: true,
        conditions: true,
        isHealthy: true,
        notes: true,
        createdAt: true,
        diagnosedBy: {
          select: {
            fullName: true,
            barangay: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(diagnoses);
  } catch (error) {
    console.error("RESIDENT_DIAGNOSES_GET_ERROR", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
