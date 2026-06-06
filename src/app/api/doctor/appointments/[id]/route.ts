import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentResidentUser } from "@/lib/current-user";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentResidentUser();

    if (!user || user.role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const barangayId = user.barangayId;
    const { id } = await context.params;
    const body = await req.json();

    const appointment = await db.appointment.findFirst({
      where: {
        id,
        doctorId: user.id,
        barangayId,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found." },
        { status: 404 }
      );
    }

    const updateData: {
      status?: string;
      suggestion?: string | null;
    } = {};

    if (body.status) {
      if (!["PENDING", "ACCEPTED", "REJECTED"].includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid appointment status." },
          { status: 400 }
        );
      }

      updateData.status = body.status;
    }

    if ("suggestion" in body) {
      updateData.suggestion = String(body.suggestion || "").trim() || null;
    }

    const updated = await db.appointment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Appointment updated successfully.",
      appointment: updated,
    });
  } catch (error) {
    console.error("DOCTOR_APPOINTMENT_PATCH_ERROR", error);

    return NextResponse.json(
      { error: "Failed to update appointment." },
      { status: 500 }
    );
  }
}
