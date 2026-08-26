import { NextResponse } from "next/server";
import { resolveAuthedUser } from "@/lib/api-auth";
import { db } from "@/lib/db";

const ALLOWED_ROLES = ["DOCTOR", "NURSE", "BHW", "MIDWIFE", "PHARMACIST", "MEDTECH", "NUTRITIONIST", "BARANGAY_ADMIN"];

async function getApiUser() {
  return resolveAuthedUser({ barangay: true });
}

function pick(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  if (v === null || v === undefined || String(v).trim() === "") return null;
  return String(v);
}

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user || !ALLOWED_ROLES.includes(String(user.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const referrals = await db.residentReferral.findMany({
      where: { targetBarangayId: user.barangayId },
      include: { sourceBarangay: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const mapped = referrals.map((r) => {
      const idata = (r.identifyingData || {}) as Record<string, unknown>;
      const fullName = pick(idata, "fullName");
      const firstName =
        pick(idata, "firstName") || (fullName ? fullName.split(" ")[0] : null) || "Referred";
      const lastName =
        pick(idata, "lastName") ||
        (fullName ? fullName.split(" ").slice(1).join(" ") : "") ||
        "";

      const ageRaw = idata.age;
      const age = typeof ageRaw === "number" ? ageRaw : Number(ageRaw) || null;

      return {
        referralId: r.id,
        status: r.status,
        reason: r.reason,
        sourceBarangayName: r.sourceBarangay?.name ?? null,
        createdAt: r.createdAt,
        resident: {
          id: r.residentId,
          firstName,
          lastName,
          middleName: pick(idata, "middleName"),
          age,
          sex: pick(idata, "sex"),
          medicalHistory: r.medicalHistory ?? null,
        },
      };
    });

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("DIAGNOSE_REFERRALS_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
