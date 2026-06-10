import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getCurrentApiUser, canManageBarangay } from "@/lib/tenant-auth";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { password } = await req.json();

    const currentUser = await getCurrentApiUser();
    if (!canManageBarangay(currentUser) || !currentUser?.barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin password
    const admin = await prisma.user.findUnique({ where: { id: currentUser.id } });
    if (!admin) {
      return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
    }
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid admin password." }, { status: 401 });
    }

    // Ensure resident belongs to this barangay
    const resident = await prisma.resident.findFirst({
      where: {
        id,
        ...(currentUser.role === "SUPER_ADMIN" ? {} : { barangayId: currentUser.barangayId }),
      },
    });
    if (!resident) {
      return NextResponse.json({ error: "Resident not found." }, { status: 404 });
    }

    // Toggle archive
    const nowArchived = !resident.isArchived;
    await prisma.resident.update({
      where: { id },
      data: {
        isArchived: nowArchived,
        archivedAt: nowArchived ? new Date() : null,
      },
    });

    return NextResponse.json({ archived: nowArchived });
  } catch (err) {
    console.error("RESIDENT_ARCHIVE_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
