import { NextResponse } from "next/server";
import { getCurrentResidentUser } from "@/lib/current-user";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentResidentUser();
    if (!user || !user.resident) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const records = await db.bMIRecord.findMany({
      where: { residentId: user.resident.id },
      include: {
        recordedBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(records);
  } catch (err) {
    console.error("RESIDENT_BMI_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
