import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentResidentUser } from "@/lib/current-user";

export const runtime = "nodejs";

// BHW manages appointments in their own barangay: accept, reject, or add a
// suggestion/note. Scoped to the BHW's barangay (not to a specific doctor).
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentResidentUser();
    if (!user || String(user.role) !== "BHW") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const appointment = await db.appointment.findFirst({
      where: { id, barangayId: user.barangayId },
    });
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    const updateData: { status?: string; suggestion?: string | null } = {};

    if (body.status) {
      if (!["PENDING", "ACCEPTED", "REJECTED"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid appointment status." }, { status: 400 });
      }
      updateData.status = String(body.status);
    }
    if ("suggestion" in body) {
      updateData.suggestion = String(body.suggestion || "").trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const updated = await db.appointment.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, appointment: updated });
  } catch (error) {
    console.error("BHW_APPOINTMENT_PATCH_ERROR", error);
    return NextResponse.json({ error: "Failed to update appointment." }, { status: 500 });
  }
}
