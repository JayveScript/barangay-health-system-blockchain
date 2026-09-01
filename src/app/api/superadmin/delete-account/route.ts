import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";

export const runtime = "nodejs";

// Super-admin only, password-confirmed. Delete one specific resident (and their
// login) or one specific staff user. Admin accounts cannot be deleted here.
export async function POST(req: Request) {
  try {
    const user = await getCurrentApiUser();
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const password = String(body.password || "");
    const residentId = body.residentId ? String(body.residentId).trim() : "";
    const userId = body.userId ? String(body.userId).trim() : "";

    if (!password) {
      return NextResponse.json({ error: "Your super-admin password is required." }, { status: 400 });
    }
    if (!residentId && !userId) {
      return NextResponse.json({ error: "Nothing selected to delete." }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }
    const ok = await bcrypt.compare(password, dbUser.password);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    if (residentId) {
      const resident = await prisma.resident.findUnique({
        where: { id: residentId },
        select: { userId: true },
      });
      if (!resident) {
        return NextResponse.json({ error: "Resident not found." }, { status: 404 });
      }
      // Delete the resident (cascades histories/diagnoses/etc.), then its login.
      await prisma.resident.delete({ where: { id: residentId } });
      if (resident.userId) {
        const linked = await prisma.user.findUnique({
          where: { id: resident.userId },
          select: { role: true },
        });
        if (linked && linked.role === "RESIDENT") {
          await prisma.user.delete({ where: { id: resident.userId } });
        }
      }
      return NextResponse.json({ success: true, deleted: "resident" });
    }

    // userId branch
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (target.role === "SUPER_ADMIN" || target.role === "BARANGAY_ADMIN") {
      return NextResponse.json(
        { error: "Admin accounts cannot be deleted here." },
        { status: 400 }
      );
    }
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true, deleted: "user" });
  } catch (err) {
    console.error("SUPERADMIN_DELETE_ACCOUNT_ERROR", err);
    return NextResponse.json({ error: "Failed to delete." }, { status: 500 });
  }
}
