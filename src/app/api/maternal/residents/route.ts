import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";
import { displayAge } from "@/lib/age";

const ALLOWED_ROLES = ["MIDWIFE", "NURSE", "BHW", "DOCTOR"];

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
        birthDate: true,
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
      age: displayAge(r.birthDate, r.age),
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
