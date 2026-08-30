import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser } from "@/lib/tenant-auth";
import { sendOtpEmail } from "@/lib/mail";

export const runtime = "nodejs";

// Any authenticated user requests a Gmail verification code to change their own
// password. The code is sent to their account email.
export async function POST() {
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
      return NextResponse.json(
        { error: "Your account has no email set. Please ask an admin to add one first." },
        { status: 400 }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({ where: { email } });
    await prisma.passwordResetToken.create({ data: { email, code, expiresAt } });
    await sendOtpEmail(email, code);

    const masked = email.replace(/^(.).*(@.*)$/, (_m, a, b) => `${a}****${b}`);
    return NextResponse.json({ success: true, email: masked });
  } catch (err) {
    console.error("CHANGE_PW_SEND_CODE_ERROR", err);
    return NextResponse.json({ error: "Unable to send the verification code." }, { status: 500 });
  }
}
