import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser, canManageBarangay, isSuperAdmin } from "@/lib/tenant-auth";
import { verifyRecord, isBlockchainEnabled, RecordType } from "@/lib/blockchain";
import {
  buildResidentRecords,
  RESIDENT_RECORD_ORDER,
  RESIDENT_RECORD_LABELS,
  type ResidentWithHistories,
} from "@/lib/resident-records";

export const runtime = "nodejs";

const ZERO_HASH = "0x" + "0".repeat(64);

export async function POST(req: Request) {
  try {
    const user = await getCurrentApiUser();
    if (!user || !(isSuperAdmin(user) || canManageBarangay(user))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const residentId = String(body.residentId || "").trim();
    if (!residentId) {
      return NextResponse.json({ error: "residentId is required." }, { status: 400 });
    }

    const resident = await prisma.resident.findFirst({
      where: {
        id: residentId,
        ...(isSuperAdmin(user) ? {} : { barangayId: user.barangayId }),
      },
      include: {
        medicalHistory: true,
        familyHistory: true,
        personalSocialHistory: true,
      },
    });

    if (!resident) {
      return NextResponse.json({ error: "Resident not found." }, { status: 404 });
    }

    const residentName = `${resident.firstName} ${resident.middleName ?? ""} ${resident.lastName}`
      .replace(/\s+/g, " ")
      .trim();

    if (!isBlockchainEnabled()) {
      return NextResponse.json({
        residentId,
        residentName,
        enabled: false,
        results: RESIDENT_RECORD_ORDER.map((recordType) => ({
          recordType,
          label: RESIDENT_RECORD_LABELS[recordType],
          status: "disabled" as const,
        })),
      });
    }

    const records = buildResidentRecords(resident as unknown as ResidentWithHistories);

    const results = [];
    for (const recordType of RESIDENT_RECORD_ORDER) {
      const data = records[recordType];
      if (!data) continue;

      try {
        const r = await verifyRecord(residentId, data, recordType as RecordType);
        const notAnchored =
          !r.onChainHash || r.onChainHash.toLowerCase() === ZERO_HASH;
        results.push({
          recordType,
          label: RESIDENT_RECORD_LABELS[recordType],
          status: notAnchored ? "not_anchored" : r.verified ? "verified" : "changed",
          onChainHash: r.onChainHash,
          currentHash: r.currentHash,
          anchoredAt: r.timestamp ? new Date(r.timestamp * 1000).toISOString() : null,
        });
      } catch (err) {
        console.error("[verify-resident] record error:", recordType, err);
        results.push({
          recordType,
          label: RESIDENT_RECORD_LABELS[recordType],
          status: "error" as const,
        });
      }
    }

    return NextResponse.json({ residentId, residentName, enabled: true, results });
  } catch (err) {
    console.error("[blockchain/verify-resident] Error:", err);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
