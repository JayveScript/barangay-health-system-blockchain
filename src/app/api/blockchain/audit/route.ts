import { NextResponse } from "next/server";

// On-chain audit logging has been removed. Only the resident's medical record
// (health + identity, sealed once at registration) and referrals are stored on
// the blockchain now. This endpoint is intentionally disabled.
const DISABLED = NextResponse.json(
  { error: "Blockchain audit logging is disabled." },
  { status: 410 }
);

export async function POST() {
  return DISABLED;
}

export async function GET() {
  return DISABLED;
}
