import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getCurrentApiUser } from "@/lib/tenant-auth";

// Verifies the CURRENT authenticated user's own password. Used to gate
// sensitive actions (e.g. viewing/editing a resident) behind a re-auth.
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentApiUser();
    if (!currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { password: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(String(password), dbUser.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ME_VERIFY_PASSWORD_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
