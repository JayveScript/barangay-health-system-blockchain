import { NextResponse } from "next/server";
import { getMedicalRecordAnchor } from "@/lib/blockchain";
import { getCurrentResidentUser } from "@/lib/current-user";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentResidentUser();
    if (!user || !user.resident) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const anchor = await getMedicalRecordAnchor(user.resident.id);
    return NextResponse.json(anchor, { status: 200 });
  } catch (err) {
    console.error("RESIDENT_ME_BLOCKCHAIN_ANCHOR_ERROR", err);
    return NextResponse.json({ configured: false, anchored: false }, { status: 200 });
  }
}
