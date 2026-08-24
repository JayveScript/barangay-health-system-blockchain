import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";

const ALLOWED_ROLES = ["MIDWIFE", "NURSE", "BHW"];

async function resolve(residentId: string) {
  const user = await getCurrentApiUser();
  if (!user || !ALLOWED_ROLES.includes(String(user.role))) {
    return { error: "Unauthorized" as const, status: 401, user: null, resident: null };
  }

  const resident = await prisma.resident.findUnique({
    where: { id: residentId },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      age: true,
      sex: true,
      birthDate: true,
      contactNumber: true,
      barangayId: true,
      barangayName: true,
    },
  });

  if (!resident) {
    return { error: "Resident not found." as const, status: 404, user, resident: null };
  }
  if (!isSuperAdmin(user) && resident.barangayId !== user.barangayId) {
    return { error: "Forbidden" as const, status: 403, user, resident: null };
  }

  return { error: null, status: 200, user, resident };
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ residentId: string }> }
) {
  try {
    const { residentId } = await context.params;
    const check = await resolve(residentId);
    if (check.error || !check.resident) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const record = await prisma.maternalRecord.findUnique({
      where: { residentId },
      select: {
        data: true,
        updatedAt: true,
        createdBy: { select: { fullName: true, role: true } },
      },
    });

    return NextResponse.json({
      resident: check.resident,
      record: record
        ? { data: record.data, updatedAt: record.updatedAt, updatedBy: record.createdBy }
        : null,
    });
  } catch (err) {
    console.error("MATERNAL_GET_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ residentId: string }> }
) {
  try {
    const { residentId } = await context.params;
    const check = await resolve(residentId);
    if (check.error || !check.user) {
      return NextResponse.json(
        { error: check.error || "Unauthorized" },
        { status: check.status }
      );
    }

    const body = await req.json();
    const data = body?.data;
    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Maternal record data is required." },
        { status: 400 }
      );
    }

    const record = await prisma.maternalRecord.upsert({
      where: { residentId },
      create: {
        residentId,
        createdById: check.user.id,
        data,
      },
      update: {
        createdById: check.user.id,
        data,
      },
      select: { updatedAt: true },
    });

    return NextResponse.json({ ok: true, updatedAt: record.updatedAt });
  } catch (err) {
    console.error("MATERNAL_PUT_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
