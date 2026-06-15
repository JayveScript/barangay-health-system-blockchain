import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentApiUser } from "@/lib/tenant-auth";

/**
 * POST /api/verify-password
 * Body: { password: string }
 *
 * Re-authenticates the CURRENT logged-in user by checking their own password.
 * Used as a confirmation gate before revealing sensitive records (any role).
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentApiUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const password = body?.password;

    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const isValid = await bcrypt.compare(String(password), user.password);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("VERIFY_PASSWORD_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
