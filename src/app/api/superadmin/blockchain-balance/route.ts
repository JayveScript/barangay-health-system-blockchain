import { NextResponse } from "next/server";
import { getWalletBalance } from "@/lib/blockchain";
import { getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";

export const runtime = "nodejs";

// Super-admin only: the anchoring wallet's balance and an estimate of how many
// more anchoring transactions it can afford, so the balance can be topped up
// before it runs out.
export async function GET() {
  const user = await getCurrentApiUser();
  if (!user || !isSuperAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const balance = await getWalletBalance();
    return NextResponse.json(balance, { status: 200 });
  } catch (err) {
    console.error("SUPERADMIN_BLOCKCHAIN_BALANCE_ERROR", err);
    return NextResponse.json({ configured: false }, { status: 200 });
  }
}
