import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser } from "@/lib/tenant-auth";
import { buildResidentQrUrl } from "@/lib/qr-url";
import { SCANNER_ALLOWED_ROLES } from "@/lib/auth-edge";

export async function GET(req: Request) {
  try {
    const user = await getCurrentApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const residentId = searchParams.get("residentId");

    if (!residentId) {
      return NextResponse.json({ error: "residentId is required" }, { status: 400 });
    }

    const role = String(user.role);
    const isScannerRole = SCANNER_ALLOWED_ROLES.has(role);
    const isOwner = user.resident?.id === residentId;

    const resident = await prisma.resident.findFirst({
      where: {
        id: residentId,
        ...(role === "SUPER_ADMIN"
          ? {}
          : isScannerRole
            ? { barangayId: user.barangayId }
            : isOwner
              ? { userId: user.id }
              : { id: "__denied__" }),
      },
      select: { id: true },
    });

    if (!resident) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    const scanUrl = buildResidentQrUrl(resident.id);

    return NextResponse.json({ scanUrl });
  } catch (error) {
    console.error("[qr-scan/url]", error);
    return NextResponse.json({ error: "Failed to generate QR URL" }, { status: 500 });
  }
}
