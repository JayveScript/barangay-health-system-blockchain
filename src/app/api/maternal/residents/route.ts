import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";

const ALLOWED_ROLES = ["MIDWIFE", "NURSE", "BHW"];

// Lists pregnant female residents (from registration) in the worker's
// barangay — these are the residents eligible for a maternal record.
export async function GET() {
  try {
    const user = await getCurrentApiUser();
    if (!user || !ALLOWED_ROLES.includes(String(user.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const residents = await prisma.resident.findMany({
      where: {
        sex: "FEMALE",
        isPregnant: true,
        isArchived: false,
        ...(isSuperAdmin(user) ? {} : { barangayId: user.barangayId ?? undefined }),
      },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        age: true,
        contactNumber: true,
        barangayName: true,
        maternalRecord: { select: { updatedAt: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const result = residents.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      middleName: r.middleName,
      lastName: r.lastName,
      age: r.age,
      contactNumber: r.contactNumber,
      sitio: r.barangayName,
      hasRecord: !!r.maternalRecord,
      updatedAt: r.maternalRecord?.updatedAt ?? null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("MATERNAL_RESIDENTS_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
