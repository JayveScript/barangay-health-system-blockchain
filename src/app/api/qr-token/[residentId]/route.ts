import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser, canManageBarangay, isSuperAdmin } from "@/lib/tenant-auth";
import { signResidentQrToken } from "@/lib/qr-token";

export const runtime = "nodejs";

const STAFF_ROLES = ["DOCTOR", "NURSE", "BHW", "MIDWIFE", "PHARMACIST", "MEDTECH", "NUTRITIONIST"];

// 10 years — a durable token for admins/staff who download/print a resident's
// official Digital ID card. Residents cannot reach this endpoint.
const DOWNLOAD_TTL_SECONDS = 60 * 60 * 24 * 365 * 10;

export async function GET(
  _req: Request,
  context: { params: Promise<{ residentId: string }> }
) {
  try {
    const { residentId } = await context.params;
    const user = await getCurrentApiUser();

    const allowed =
      canManageBarangay(user) || STAFF_ROLES.includes(String(user?.role || ""));
    if (!allowed || !user?.barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      select: { id: true, barangayId: true },
    });
    if (!resident) {
      return NextResponse.json({ error: "Resident not found." }, { status: 404 });
    }
    if (!isSuperAdmin(user) && resident.barangayId !== user.barangayId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const token = signResidentQrToken(resident.id, DOWNLOAD_TTL_SECONDS);
    return NextResponse.json(
      { token },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("QR_TOKEN_STAFF_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
