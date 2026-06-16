import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentApiUser } from "@/lib/tenant-auth";

// Clinical / support roles that may view their barangay's resident statistics.
const ALLOWED_ROLES = ["STAFF", "BHW", "NURSE", "MIDWIFE", "DOCTOR"];

/**
 * GET /api/residents/stats
 * Aggregate resident statistics for the current user's barangay:
 * totals, sex distribution, and age groups — for dashboard charts.
 */
export async function GET() {
  try {
    const user = await getCurrentApiUser();

    if (!user || !ALLOWED_ROLES.includes(String(user.role)) || !user.barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const residents = await db.resident.findMany({
      where: { barangayId: user.barangayId },
      select: {
        sex: true,
        age: true,
        user: { select: { isVerified: true } },
      },
    });

    const totalResidents = residents.length;
    let verifiedResidents = 0;
    let male = 0;
    let female = 0;
    let other = 0;
    const groups: Record<string, number> = {
      "0-12": 0,
      "13-17": 0,
      "18-35": 0,
      "36-59": 0,
      "60+": 0,
    };

    for (const r of residents) {
      if (r.user?.isVerified) verifiedResidents += 1;

      const sex = String(r.sex || "").toUpperCase();
      if (sex === "MALE") male += 1;
      else if (sex === "FEMALE") female += 1;
      else other += 1;

      const age = r.age ?? 0;
      if (age <= 12) groups["0-12"] += 1;
      else if (age <= 17) groups["13-17"] += 1;
      else if (age <= 35) groups["18-35"] += 1;
      else if (age <= 59) groups["36-59"] += 1;
      else groups["60+"] += 1;
    }

    return NextResponse.json({
      stats: { totalResidents, verifiedResidents, other },
      sex: [
        { name: "Male", value: male },
        { name: "Female", value: female },
        { name: "Other / Not Set", value: other },
      ],
      ageGroups: Object.entries(groups).map(([name, total]) => ({ name, total })),
      barangayName: user.barangay?.name ?? null,
    });
  } catch (error) {
    console.error("RESIDENTS_STATS_ERROR", error);
    return NextResponse.json(
      { error: "Failed to load resident statistics." },
      { status: 500 }
    );
  }
}
