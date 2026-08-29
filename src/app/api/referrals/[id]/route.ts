import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentApiUser } from "@/lib/tenant-auth";
import { sendReferralAcceptedEmail } from "@/lib/mail";

const ALLOWED_ROLES = ["BHW", "DOCTOR", "NURSE", "MIDWIFE"];

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
          select: { id: true, fullName: true, username: true, email: true },
        },
      },
    });

    // On accept, email the referring staff that their patient was accepted.
    if (newStatus === "ACCEPTED" && updated.referredByStaff?.email) {
      const idata = (updated.identifyingData || {}) as Record<string, unknown>;
      const residentName =
        String(
          idata.fullName ||
            `${idata.firstName || ""} ${idata.lastName || ""}`
        )
          .replace(/\s+/g, " ")
          .trim() || "the referred patient";
      sendReferralAcceptedEmail(
        updated.referredByStaff.email,
        updated.targetBarangay.name,
        residentName
      ).catch((e) => console.error("[mail] referral accepted email failed:", e));
    }

    return NextResponse.json({ success: true, referral: updated });
  } catch (error) {
    console.error("REFERRAL_PATCH_ERROR", error);
    return NextResponse.json(
      { error: "Failed to update referral." },
      { status: 500 }
    );
  }
}
