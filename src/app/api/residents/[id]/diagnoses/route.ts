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

    const diagnoses = await prisma.diagnosis.findMany({
      where: {
        residentId: id,
        ...(currentUser.role === "SUPER_ADMIN"
          ? {}
          : { barangayId: currentUser.barangayId }),
      },
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
  } catch (err) {
    console.error("RESIDENT_DIAGNOSES_ADMIN_GET_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
