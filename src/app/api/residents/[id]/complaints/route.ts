import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";
import { SCANNER_ALLOWED_ROLES } from "@/lib/auth-edge";


async function assertScannerForResident(residentId: string) {
  const user = await getCurrentApiUser();
  if (!user || !SCANNER_ALLOWED_ROLES.has(String(user.role))) {
    return { error: "Unauthorized" as const, status: 401, user: null, resident: null };
  }

  const resident = await prisma.resident.findUnique({
    where: { id: residentId },
    select: { id: true, barangayId: true },
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const check = await assertScannerForResident(id);
    if (check.error) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const complaints = await prisma.complaint.findMany({
      where: { residentId: id },
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
    console.error("RESIDENT_COMPLAINTS_GET_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const check = await assertScannerForResident(id);
    if (check.error || !check.user) {
      return NextResponse.json(
        { error: check.error || "Unauthorized" },
        { status: check.status }
      );
    }

    const body = await req.json();
    const text = String(body?.text ?? "").trim();

    if (!text) {
      return NextResponse.json(
        { error: "Complaint text is required." },
        { status: 400 }
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { error: "Complaint is too long (max 2000 characters)." },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaint.create({
      data: {
        residentId: id,
        createdById: check.user.id,
        text,
      },
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
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (err) {
    console.error("RESIDENT_COMPLAINTS_POST_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
