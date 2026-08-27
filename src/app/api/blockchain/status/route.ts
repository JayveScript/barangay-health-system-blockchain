
import { NextResponse } from "next/server";
import { isBlockchainEnabled, isBlockchainReachable } from "@/lib/blockchain";

export async function GET() {
  if (!isBlockchainEnabled()) {
    return NextResponse.json(
      {
        blockchain: "disabled",
        enabled: false,
        rpcUrl: process.env.BLOCKCHAIN_RPC_URL ?? "not set",
      },
      { status: 200 }
    );
  }

  const reachable = await isBlockchainReachable();
  return NextResponse.json(
    {
      blockchain: reachable ? "online" : "offline",
      enabled: true,
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL ?? "not set",
    },
    { status: reachable ? 200 : 503 }
  );
}
