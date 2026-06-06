import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("auth_token")?.value ||
      cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let payload: { userId: string };

    try {
      payload = verifyAuthToken(token) as { userId: string };
    } catch {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: {
        id: payload.userId,
      },
      include: {
        barangay: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET_CURRENT_USER_ERROR", error);
    return NextResponse.json(
      { error: "Failed to load user." },
      { status: 500 }
    );
  }
}