/**
 * POST /api/blockchain/audit
 * Log a sensitive event to the immutable on-chain audit trail.
 *
 * Body: {
 *   eventType: number,   // AuditEventType constant
 *   actorId: string,     // user UUID
 *   targetId: string,    // resident UUID
 *   barangayId: string,
 *   dataHash?: string,   // optional bytes32 hex
 *   meta?: object        // optional small metadata object
 * }
 * Response: { auditId, txHash }
 *
 * GET /api/blockchain/audit?id=<number>
 * Retrieve a single audit entry by ID.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  logAuditEvent,
  getAuditEntry,
  AuditEventType,
  AuditEventTypeValue,
} from "@/lib/blockchain";
import { getCurrentResidentUser } from "@/lib/current-user";

const VALID_EVENT_TYPES = Object.values(AuditEventType) as number[];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentResidentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { eventType, actorId, targetId, barangayId, dataHash, meta } = await req.json();

    if (!eventType || !actorId || !targetId || !barangayId) {
      return NextResponse.json(
        { error: "eventType, actorId, targetId, and barangayId are required" },
        { status: 400 }
      );
    }

    if (!VALID_EVENT_TYPES.includes(Number(eventType))) {
      return NextResponse.json(
        { error: `eventType must be one of: ${VALID_EVENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await logAuditEvent(
      Number(eventType) as AuditEventTypeValue,
      actorId,
      targetId,
      barangayId,
      dataHash ?? null,
      meta ?? null
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[blockchain/audit POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to log audit event", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentResidentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "Query param ?id=<number> is required" }, { status: 400 });
    }

    const entry = await getAuditEntry(Number(id));

    return NextResponse.json({
      success: true,
      entry: {
        ...entry,
        timestamp: new Date(entry.timestamp * 1000).toISOString(),
      },
    });
  } catch (err) {
    console.error("[blockchain/audit GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch audit entry", detail: String(err) },
      { status: 500 }
    );
  }
}
