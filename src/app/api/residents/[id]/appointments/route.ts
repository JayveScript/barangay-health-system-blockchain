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

    const appointments = await prisma.appointment.findMany({
      where: {
        residentId: id,
        ...(currentUser.role === "SUPER_ADMIN"
          ? {}
          : { barangayId: currentUser.barangayId }),
      },
      select: {
        id: true,
        date: true,
        time: true,
        reason: true,
        otherReason: true,
        suggestion: true,
        status: true,
        doctor: { select: { fullName: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(appointments);
  } catch (err) {
    console.error("RESIDENT_APPOINTMENTS_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
