import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";
import { isBlockchainEnabled, anchorRecordsBatch, type BackfillEntry, type RecordType } from "@/lib/blockchain";
import {
  buildResidentRecords,
  MEDICAL_RECORD_ORDER,
  type ResidentWithHistories,
} from "@/lib/resident-records";

export const runtime = "nodejs";
export const maxDuration = 60;

// Super-admin one-time backfill: anchor every existing resident's medical
// records (medical / family / personal-social) that aren't on-chain yet.
export async function POST() {
  try {
    const user = await getCurrentApiUser();
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isBlockchainEnabled()) {
      return NextResponse.json(
        { error: "Turn the blockchain ON first (BLOCKCHAIN_ENABLED=true), then run the backfill." },
        { status: 400 }
      );
    }

    const residents = await prisma.resident.findMany({
      where: { isArchived: false },
      include: {
        medicalHistory: true,
        familyHistory: true,
        personalSocialHistory: true,
      },
    });

    const entries: BackfillEntry[] = [];
    for (const resident of residents) {
      const records = buildResidentRecords(resident as unknown as ResidentWithHistories);
      for (const recordType of MEDICAL_RECORD_ORDER) {
        const data = records[recordType];
        if (data) {
          entries.push({ residentId: resident.id, recordType: recordType as RecordType, data });
        }
      }
    }

    const result = await anchorRecordsBatch(entries);

    return NextResponse.json({
      success: true,
      residents: residents.length,
      ...result,
      message:
        `Submitted ${result.submitted} record(s) for anchoring` +
        (result.skipped ? `, skipped ${result.skipped} already-anchored` : "") +
        (result.failed ? `, ${result.failed} failed` : "") +
        ". They confirm on-chain within a minute.",
    });
  } catch (err) {
    console.error("SUPERADMIN_ANCHOR_ALL_ERROR", err);
    return NextResponse.json({ error: "Backfill failed." }, { status: 500 });
  }
}
