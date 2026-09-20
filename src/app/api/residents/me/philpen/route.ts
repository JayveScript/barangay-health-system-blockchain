import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentResidentUser } from "@/lib/current-user";

export const runtime = "nodejs";

// The signed-in resident's OWN PhilPEN record (read-only in the portal).
export async function GET() {
  try {
    const user = await getCurrentResidentUser();
    if (!user || !user.resident) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const resident = await prisma.resident.findUnique({
      where: { id: user.resident.id },
      select: { philpenData: true },
    });
    return NextResponse.json({ data: (resident?.philpenData as Record<string, unknown>) ?? {} });
  } catch (err) {
    console.error("RESIDENT_ME_PHILPEN_ERROR", err);
    return NextResponse.json({ data: {} }, { status: 200 });
  }
}
