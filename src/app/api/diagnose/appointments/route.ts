import { NextResponse } from "next/server";
import { resolveAuthedUser } from "@/lib/api-auth";
import { db } from "@/lib/db";

const ALLOWED_ROLES = ["DOCTOR", "NURSE"];

async function getApiUser() {
  return resolveAuthedUser({ barangay: true });
}

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user || !ALLOWED_ROLES.includes(String(user.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const appointments = await db.appointment.findMany({
      where: {
        barangayId: user.barangayId,
        status: "ACCEPTED",
        date: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
      include: {
        resident: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            age: true,
            sex: true,
            medicalHistory: true,
          },
        },
        doctor: { select: { fullName: true } },
        _count: { select: { diagnoses: true } },
      },
      orderBy: [{ time: "asc" }],
      take: 100,
    });

    const data = appointments.map((appt) => ({
      id: appt.id,
      date: appt.date,
      time: appt.time,
      reason: appt.reason,
      otherReason: appt.otherReason,
      status: appt.status,
      doctorName: appt.doctor?.fullName || null,
      diagnosedCount: appt._count.diagnoses,
      resident: appt.resident,
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error("DIAGNOSE_APPOINTMENTS_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
