import { NextResponse } from "next/server";
import { getWalletBalance } from "@/lib/blockchain";
import { getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";

export const runtime = "nodejs";

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
