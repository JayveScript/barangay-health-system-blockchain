import { NextResponse } from "next/server";
import { getMedicalRecordAnchor } from "@/lib/blockchain";
import { getCurrentApiUser, canManageBarangay } from "@/lib/tenant-auth";

export const runtime = "nodejs";

const STAFF_ROLES = ["DOCTOR", "NURSE", "BHW", "MIDWIFE", "PHARMACIST", "MEDTECH", "NUTRITIONIST"];

// Where this resident's medical record is anchored on the blockchain
// (block number, tx, hash). Staff + admins only.
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentApiUser();
    const canView =
      canManageBarangay(user) || STAFF_ROLES.includes(String(user?.role || ""));
    if (!canView) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const anchor = await getMedicalRecordAnchor(id);
    return NextResponse.json(anchor, { status: 200 });
  } catch (err) {
    console.error("RESIDENT_BLOCKCHAIN_ANCHOR_ERROR", err);
    return NextResponse.json({ configured: false, anchored: false }, { status: 200 });
  }
}
