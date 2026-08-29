import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";

export const runtime = "nodejs";

// Super-admin only, password-confirmed. Deletes ALL residents and ALL non-admin
// users (and everything that cascades off them). Super admins and barangay
// admins are kept.
export async function POST(req: Request) {
  try {
    const user = await getCurrentApiUser();
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const password = String(body.password || "");
    if (!password) {
      return NextResponse.json(
        { error: "Your super-admin password is required." },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const ok = await bcrypt.compare(password, dbUser.password);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    // Order matters: residents first (cascades their history/appointments/
    // diagnoses/referrals/etc.), then non-admin users (cascades their staff
    // records), keeping SUPER_ADMIN and BARANGAY_ADMIN.
    const [pending, residents, users] = await prisma.$transaction([
      prisma.pendingRegistration.deleteMany({}),
      prisma.resident.deleteMany({}),
      prisma.user.deleteMany({
        where: { role: { notIn: ["SUPER_ADMIN", "BARANGAY_ADMIN"] } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      deleted: {
        pendingRegistrations: pending.count,
        residents: residents.count,
        users: users.count,
      },
    });
  } catch (err) {
    console.error("SUPERADMIN_RESET_DATA_ERROR", err);
    return NextResponse.json({ error: "Failed to reset data." }, { status: 500 });
  }
}
