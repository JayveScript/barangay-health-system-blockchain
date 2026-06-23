import { NextResponse } from "next/server";
import { resolveAuthedUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const user = await resolveAuthedUser({ barangay: true });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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