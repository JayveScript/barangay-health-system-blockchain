import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  canManageBarangay,
  getCurrentApiUser,
  isSuperAdmin,
} from "@/lib/tenant-auth";

// GET /api/barangays
// Lists barangays for the admin barangay switcher. A SUPER_ADMIN gets every
// barangay; a barangay admin only gets their own.
export async function GET() {
  try {
    const user = await getCurrentApiUser();

    if (!canManageBarangay(user) || !user?.barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const barangays = await db.barangay.findMany({
      where: isSuperAdmin(user) ? {} : { id: user.barangayId },
      select: { id: true, name: true, municipality: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ barangays, isSuperAdmin: isSuperAdmin(user) });
  } catch (error) {
    console.error("BARANGAYS_LIST_ERROR", error);
    return NextResponse.json(
      { error: "Failed to load barangays." },
      { status: 500 }
    );
  }
}
