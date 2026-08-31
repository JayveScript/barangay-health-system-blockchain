import { NextResponse } from "next/server";
import { getCurrentApiUser, canManageBarangay } from "@/lib/tenant-auth";
import { db } from "@/lib/db";
import { sendOtpEmail } from "@/lib/mail";

export const runtime = "nodejs";

// Admin sends a verification code to the new staff member's email before the
// account can be created.
export async function POST(req: Request) {
  try {
    const admin = await getCurrentApiUser();
    if (!canManageBarangay(admin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address first." }, { status: 400 });
    }

    const [takenByUser, takenByResident] = await Promise.all([
      db.user.findUnique({ where: { email } }),
      db.resident.findUnique({ where: { email } }),
    ]);
    if (takenByUser || takenByResident) {
      return NextResponse.json(
        { error: "This email is already in use by another account or resident." },
        { status: 400 }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.passwordResetToken.deleteMany({ where: { email } });
    await db.passwordResetToken.create({ data: { email, code, expiresAt } });
    await sendOtpEmail(email, code);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CREATE_USER_SEND_CODE_ERROR", err);
    return NextResponse.json({ error: "Unable to send the verification code." }, { status: 500 });
  }
}
