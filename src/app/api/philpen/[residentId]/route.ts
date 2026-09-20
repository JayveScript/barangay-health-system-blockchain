import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser, isSuperAdmin, canManageBarangay } from "@/lib/tenant-auth";

export const runtime = "nodejs";

// Part I: BHW / Midwife / Nurse. Part II: Nurse / Doctor. Both save to one blob.
const ALLOWED_ROLES = ["BHW", "MIDWIFE", "NURSE", "DOCTOR"];

async function guard(residentId: string) {
  const user = await getCurrentApiUser();
  const role = String(user?.role || "");
  const ok = !!user && (ALLOWED_ROLES.includes(role) || canManageBarangay(user) || isSuperAdmin(user));
  if (!ok) return { error: "Unauthorized", status: 401 as const, user: null };
  // Not barangay-scoped: PhilPEN is a clinical assessment reachable via QR scans
  // and cross-barangay referrals, like the resident's medical history.
  const resident = await prisma.resident.findUnique({
    where: { id: residentId },
    select: { id: true },
  });
  if (!resident) return { error: "Resident not found", status: 404 as const, user: null };
  return { error: null, status: 200 as const, user };
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ residentId: string }> }
) {
  try {
    const { residentId } = await context.params;
    const check = await guard(residentId);
    if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      select: { philpenData: true },
    });
    return NextResponse.json({ data: (resident?.philpenData as Record<string, unknown>) ?? {} });
  } catch (err) {
    console.error("PHILPEN_GET_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ residentId: string }> }
) {
  try {
    const { residentId } = await context.params;
    const check = await guard(residentId);
    if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

    const body = await req.json().catch(() => ({}));
    const data = body?.data && typeof body.data === "object" ? body.data : {};

    await prisma.resident.update({
      where: { id: residentId },
      data: { philpenData: data },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PHILPEN_PUT_ERROR", err);
    return NextResponse.json({ error: "Failed to save PhilPEN record." }, { status: 500 });
  }
}
