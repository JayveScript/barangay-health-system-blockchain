import { NextResponse } from "next/server";
import { resolveAuthedUser } from "@/lib/api-auth";
import { signResidentQrToken } from "@/lib/qr-token";

export const runtime = "nodejs";

const RESIDENT_TTL_SECONDS = 90;

// A resident fetches a short-lived token for their OWN live Digital ID QR.
// The QR rotates on the client, so a screenshot becomes unscannable in ~90s.
export async function GET() {
  try {
    const user = await resolveAuthedUser({ resident: true });
    if (!user || String(user.role) !== "RESIDENT" || !user.resident) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = signResidentQrToken(user.resident.id, RESIDENT_TTL_SECONDS);
    return NextResponse.json(
      { token, ttl: RESIDENT_TTL_SECONDS },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("QR_TOKEN_ME_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
