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

    // A staff member sees their own barangay's assessments for this resident
    // (any authoring role — doctor, nurse, midwife, BHW all share them). When
    // the viewer's barangay is party to a referral for this resident (as sender
    // OR receiver), they see EVERY assessment recorded for that resident, so the
    // sending and receiving teams read each other's notes. We match on the
    // referral link rather than the assessment's barangay id, because the
    // assessment is stamped with the assessing staff's barangay, which may not
    // be the exact barangay record picked as the referral target.
    const involvedInReferral =
      !isSuperAdmin(currentUser) &&
      (await prisma.residentReferral.count({
        where: {
          residentId: id,
          OR: [
            { sourceBarangayId: currentUser.barangayId },
            { targetBarangayId: currentUser.barangayId },
          ],
        },
      })) > 0;

    const seeAll = isSuperAdmin(currentUser) || involvedInReferral;

    const diagnoses = await prisma.diagnosis.findMany({
      where: {
        residentId: id,
        ...(seeAll ? {} : { barangayId: currentUser.barangayId }),
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
