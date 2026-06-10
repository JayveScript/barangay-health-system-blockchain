import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser, canManageBarangay } from "@/lib/tenant-auth";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const currentUser = await getCurrentApiUser();

    if (!canManageBarangay(currentUser) || !currentUser?.barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bmiRecords = await prisma.bMIRecord.findMany({
      where: {
        residentId: id,
        ...(currentUser.role === "SUPER_ADMIN"
          ? {}
          : { barangayId: currentUser.barangayId }),
      },
      select: {
        id: true,
        height: true,
        weight: true,
        bmi: true,
        bmiCategory: true,
        pulseRate: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bmiRecords);
  } catch (err) {
    console.error("RESIDENT_BMI_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
