import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { canManageBarangay, getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";

async function verifyAdminPassword(userId: string, password: string) {
  const admin = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!admin) {
    return { ok: false, error: "Admin account not found.", status: 404 };
  }

  const isValid = await bcrypt.compare(password, admin.password);

  if (!isValid) {
    return { ok: false, error: "Invalid admin password.", status: 401 };
  }

  return { ok: true, error: "", status: 200 };
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { password, fullName, username, role } = await req.json();
    const currentUser = await getCurrentApiUser();
    const currentUserId = currentUser?.id;
    const barangayId = currentUser?.barangayId;

    if (!canManageBarangay(currentUser) || !currentUserId || !barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required." }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Admin password is required." }, { status: 400 });
    }

    const verified = await verifyAdminPassword(currentUserId, password);

    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: verified.status });
    }

    const staffUser = await prisma.user.findFirst({
      where: { id, role: { not: "RESIDENT" }, ...(isSuperAdmin(currentUser) ? {} : { barangayId }) },
      select: { id: true },
    });

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found." }, { status: 404 });
    }

    const updatedStaffUser = await prisma.user.update({
      where: { id },
      data: {
        fullName: fullName || null,
        username,
        role,
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
        createdAt: true,
        barangay: { select: { name: true } },
      },
    });

    return NextResponse.json({
      message: "Staff user updated successfully.",
      staffUser: updatedStaffUser,
    });
  } catch (error) {
    console.error("UPDATE_STAFF_USER_ERROR:", error);

    return NextResponse.json({ error: "Failed to update staff user." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { password } = await req.json();
    const currentUser = await getCurrentApiUser();
    const currentUserId = currentUser?.id;
    const barangayId = currentUser?.barangayId;

    if (!canManageBarangay(currentUser) || !currentUserId || !barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required." }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Admin password is required." }, { status: 400 });
    }

    if (id === currentUserId) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    const verified = await verifyAdminPassword(currentUserId, password);

    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: verified.status });
    }

    const staffUser = await prisma.user.findFirst({
      where: { id, role: { not: "RESIDENT" }, ...(isSuperAdmin(currentUser) ? {} : { barangayId }) },
      select: { id: true },
    });

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found." }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "Staff user deleted successfully." });
  } catch (error) {
    console.error("DELETE_STAFF_USER_ERROR:", error);

    return NextResponse.json({ error: "Failed to delete staff user." }, { status: 500 });
  }
}
