
import { NextRequest, NextResponse } from "next/server";
import { anchorRecord, RecordType } from "@/lib/blockchain";
import { getCurrentResidentUser } from "@/lib/current-user";

const VALID_RECORD_TYPES: RecordType[] = [
  "medical_history",
  "family_history",
  "personal_social",
  "resident_profile",
  "bmi_record",
  "referral",
];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentResidentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { residentId, recordData, recordType } = await req.json();

    if (!residentId || !recordData || !recordType) {
      return NextResponse.json(
        { error: "residentId, recordData, and recordType are required" },
        { status: 400 }
      );
    }

    if (!VALID_RECORD_TYPES.includes(recordType)) {
      return NextResponse.json(
        { error: `recordType must be one of: ${VALID_RECORD_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await anchorRecord(residentId, recordData, recordType as RecordType);

    return NextResponse.json({
      success: true,
      txHash: result.txHash,
      recordHash: result.recordHash,
      residentId,
      recordType,
    });
  } catch (err) {
    console.error("[blockchain/anchor] Error:", err);
    return NextResponse.json(
      { error: "Failed to anchor record", detail: String(err) },
      { status: 500 }
    );
  }
}
