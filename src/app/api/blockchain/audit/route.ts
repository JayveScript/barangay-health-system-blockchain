import { NextResponse } from "next/server";

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
