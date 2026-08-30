import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser } from "@/lib/tenant-auth";

export const runtime = "nodejs";

// Verify the emailed code and set the new password for the current user.
export async function POST(req: Request) {
  try {
    const authed = await getCurrentApiUser();
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authed.id },
      select: { email: true },
    });
    const email = user?.email?.trim();
    if (!email) {
      return NextResponse.json({ error: "Your account has no email set." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim();
    const newPassword = String(body.newPassword || "");

    if (!code || !newPassword) {
      return NextResponse.json(
        { error: "Verification code and new password are required." },
        { status: 400 }
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const token = await prisma.passwordResetToken.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });
    if (!token) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 }
      );
    }
    if (token.code !== code) {
      return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
    }
    if (new Date() > token.expiresAt) {
      await prisma.passwordResetToken.deleteMany({ where: { email } });
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: authed.id },
      data: { password: hashed, tokenVersion: { increment: 1 } },
    });
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CHANGE_PW_CONFIRM_ERROR", err);
    return NextResponse.json({ error: "Unable to change your password." }, { status: 500 });
  }
}
