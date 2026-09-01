import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser, canManageBarangay, isSuperAdmin } from "@/lib/tenant-auth";

const STAFF_ROLES = ["DOCTOR", "NURSE", "BHW", "MIDWIFE", "PHARMACIST", "MEDTECH", "NUTRITIONIST"];

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const currentUser = await getCurrentApiUser();

    const canView =
      canManageBarangay(currentUser) ||
      STAFF_ROLES.includes(String(currentUser?.role || ""));

    if (!canView || !currentUser?.barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // A staff member always sees their own barangay's assessments for this
    // resident (any authoring role — doctor, nurse, midwife, BHW all share
    // them). When the resident is tied to this barangay through a referral, we
    // also include the barangay on the other side of that referral, so both the
    // sending and receiving teams can read each other's previous assessments.
    const barangayIds = new Set<string>([currentUser.barangayId]);
    if (!isSuperAdmin(currentUser)) {
      const referrals = await prisma.residentReferral.findMany({
        where: {
          residentId: id,
          OR: [
            { sourceBarangayId: currentUser.barangayId },
            { targetBarangayId: currentUser.barangayId },
          ],
        },
        select: { sourceBarangayId: true, targetBarangayId: true },
      });
      for (const r of referrals) {
        barangayIds.add(r.sourceBarangayId);
        barangayIds.add(r.targetBarangayId);
      }
    }

    const diagnoses = await prisma.diagnosis.findMany({
      where: {
        residentId: id,
        ...(isSuperAdmin(currentUser)
          ? {}
          : { barangayId: { in: [...barangayIds] } }),
      },
      select: {
        id: true,
        conditions: true,
        isHealthy: true,
        notes: true,
        medicalAdvice: true,
        createdAt: true,
        diagnosedBy: {
          select: {
            fullName: true,
            role: true,
            barangay: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(diagnoses);
  } catch (err) {
    console.error("RESIDENT_DIAGNOSES_ADMIN_GET_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
