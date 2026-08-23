import { NextResponse } from "next/server";
import { resolveAuthedUser } from "@/lib/api-auth";
import { db } from "@/lib/db";

// Returns the logged-in resident's complaints, showing which health worker
// recorded each one and when.
export async function GET() {
  try {
    const user = await resolveAuthedUser({ resident: true });

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

    const complaints = await db.complaint.findMany({
      where: { residentId: resident.id },
      select: {
        id: true,
        text: true,
        createdAt: true,
        createdBy: {
          select: {
            fullName: true,
            role: true,
            barangay: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(complaints);
  } catch (err) {
    console.error("RESIDENT_ME_COMPLAINTS_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
