import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, reset code, and new password are required." },
        { status: 400 }
      );
    }

    // Verify the reset token
    const token = await prisma.passwordResetToken.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return NextResponse.json(
        { error: "No reset code found. Please request a new one." },
        { status: 400 }
      );
    }

    if (token.code !== String(code).trim()) {
      return NextResponse.json(
        { error: "Invalid reset code." },
        { status: 400 }
      );
    }

    if (new Date() > token.expiresAt) {
      await prisma.passwordResetToken.deleteMany({ where: { email } });
      return NextResponse.json(
        { error: "Reset code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Token is valid — update password and delete the token
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      // Bump tokenVersion to revoke any existing sessions for this account.
      data: { password: hashedPassword, tokenVersion: { increment: 1 } },
    });

    await prisma.passwordResetToken.deleteMany({ where: { email } });

    return NextResponse.json({ message: "Password reset successful." });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}