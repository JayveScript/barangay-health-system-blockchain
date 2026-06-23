import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { canManageBarangay, getCurrentApiUser } from "@/lib/tenant-auth";

async function verifyAdminPassword(userId: string, password: string) {
  const admin = await prisma.user.findUnique({ where: { id: userId } });

  if (!admin) {
    return { ok: false, error: "Admin account not found.", status: 404 };
  }

  const isValid = await bcrypt.compare(password, admin.password);

  if (!isValid) {
    return { ok: false, error: "Invalid admin password.", status: 401 };
  }

  return { ok: true, error: "", status: 200 };
}

// POST /api/staff/[id]/reset-password
// Lets a barangay admin set a new password for one of their staff/clinical
// users, confirming with the admin's own password.
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { password, newPassword } = await req.json();
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
      return NextResponse.json(
        { error: "Admin password is required." },
        { status: 400 }
      );
    }

    const nextPassword = String(newPassword || "").trim();

    if (nextPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const verified = await verifyAdminPassword(currentUserId, password);

    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: verified.status });
    }

    const staffUser = await prisma.user.findFirst({
      where: { id, barangayId, role: { not: "RESIDENT" } },
      select: { id: true },
    });

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found." }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(nextPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });

    return NextResponse.json({
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("RESET_STAFF_PASSWORD_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to reset password." },
      { status: 500 }
    );
  }
}
