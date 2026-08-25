
import { NextRequest, NextResponse } from "next/server";
import { verifyRecord, RecordType } from "@/lib/blockchain";
import { getCurrentResidentUser } from "@/lib/current-user";

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

    const result = await verifyRecord(residentId, recordData, recordType as RecordType);

    return NextResponse.json({
      success: true,
      ...result,
      anchoredAt: result.timestamp ? new Date(result.timestamp * 1000).toISOString() : null,
    });
  } catch (err) {
    console.error("[blockchain/verify] Error:", err);
    return NextResponse.json(
      { error: "Verification failed", detail: String(err) },
      { status: 500 }
    );
  }
}
