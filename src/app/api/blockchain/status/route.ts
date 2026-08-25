
import { NextResponse } from "next/server";
import { isBlockchainReachable } from "@/lib/blockchain";

export async function GET() {
  const reachable = await isBlockchainReachable();
  return NextResponse.json(
    {
      blockchain: reachable ? "online" : "offline",
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL ?? "not set",
    },
    { status: reachable ? 200 : 503 }
  );
}
