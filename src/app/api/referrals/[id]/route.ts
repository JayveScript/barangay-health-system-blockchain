import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentApiUser } from "@/lib/tenant-auth";
import { logAuditEvent, AuditEventType } from "@/lib/blockchain";

const ALLOWED_ROLES = ["BHW", "DOCTOR", "NURSE"];

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentApiUser();

    if (!user || !ALLOWED_ROLES.includes(String(user.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "").toLowerCase();

    if (action !== "accept" && action !== "reject") {
      return NextResponse.json(
        { error: "action must be 'accept' or 'reject'." },
        { status: 400 }
      );
    }

    const referral = await db.residentReferral.findUnique({ where: { id } });

    if (!referral) {
      return NextResponse.json({ error: "Referral not found." }, { status: 404 });
    }

    if (referral.targetBarangayId !== user.barangayId) {
      return NextResponse.json(
        { error: "You can only act on referrals sent to your barangay." },
        { status: 403 }
      );
    }

    if (referral.status !== "PENDING") {
      return NextResponse.json(
        { error: `This referral is already ${referral.status.toLowerCase()}.` },
        { status: 400 }
      );
    }

    const newStatus = action === "accept" ? "ACCEPTED" : "REJECTED";

    const updated = await db.residentReferral.update({
      where: { id },
      data: { status: newStatus },
      include: {
        sourceBarangay: true,
        targetBarangay: true,
        referredByStaff: {
          select: { id: true, fullName: true, username: true },
        },
      },
    });

    logAuditEvent(
      action === "accept"
        ? AuditEventType.REFERRAL_ACCEPTED
        : AuditEventType.REFERRAL_REJECTED,
      user.id,
      referral.residentId,
      user.barangayId,
      null,
      { role: String(user.role), referralId: id, status: newStatus }
    ).catch((err) =>
      console.error("[blockchain] referral status audit failed:", err)
    );

    return NextResponse.json({ success: true, referral: updated });
  } catch (error) {
    console.error("REFERRAL_PATCH_ERROR", error);
    return NextResponse.json(
      { error: "Failed to update referral." },
      { status: 500 }
    );
  }
}
