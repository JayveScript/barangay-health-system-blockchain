import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser, isSuperAdmin, canManageBarangay } from "@/lib/tenant-auth";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["BHW", "MIDWIFE", "NURSE", "DOCTOR"];

async function guard() {
  const user = await getCurrentApiUser();
  const role = String(user?.role || "");
  const ok = !!user && (ALLOWED_ROLES.includes(role) || canManageBarangay(user) || isSuperAdmin(user));
  return ok ? { ok: true as const } : { ok: false as const };
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ residentId: string }> }
) {
  try {
    const { residentId } = await context.params;
    const g = await guard();
    if (!g.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      select: { immunizationData: true },
    });
    if (!resident) return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    return NextResponse.json({ data: (resident.immunizationData as Record<string, unknown>) ?? {} });
  } catch (err) {
    console.error("IMMUNIZATION_GET_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ residentId: string }> }
) {
  try {
    const { residentId } = await context.params;
    const g = await guard();
    if (!g.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const data = body?.data && typeof body.data === "object" ? body.data : {};
    const exists = await prisma.resident.findUnique({ where: { id: residentId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    await prisma.resident.update({ where: { id: residentId }, data: { immunizationData: data } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("IMMUNIZATION_PUT_ERROR", err);
    return NextResponse.json({ error: "Failed to save immunization record." }, { status: 500 });
  }
}
