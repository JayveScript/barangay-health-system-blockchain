import { NextResponse } from "next/server";
import { isBlockchainEnabled, isBlockchainReachable } from "@/lib/blockchain";
import { getCurrentApiUser, isSuperAdmin, canManageBarangay } from "@/lib/tenant-auth";

// Admin-only: only super admins and barangay admins can read the blockchain
// status — never residents/staff.
export async function GET() {
  const user = await getCurrentApiUser();
  if (!user || !(isSuperAdmin(user) || canManageBarangay(user))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isBlockchainEnabled()) {
    return NextResponse.json({ blockchain: "disabled", enabled: false }, { status: 200 });
  }

  const reachable = await isBlockchainReachable();
  return NextResponse.json(
    { blockchain: reachable ? "online" : "offline", enabled: true },
    { status: reachable ? 200 : 503 }
  );
}
