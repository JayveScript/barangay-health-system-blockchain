import { NextResponse } from "next/server";
import { resolveAuthedUser } from "@/lib/api-auth";
import { db } from "@/lib/db";

async function getApiUser() {
  return resolveAuthedUser({ resident: true });
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
