import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth";

const ALLOWED_ROLES = ["DOCTOR", "NURSE"];

async function getApiUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const payload = verifyAuthToken(token);
    return await db.user.findUnique({
      where: { id: payload.userId },
      include: { barangay: true },
    });
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user || !ALLOWED_ROLES.includes(String(user.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointments = await db.appointment.findMany({
      where: {
        barangayId: user.barangayId,
        status: "ACCEPTED",
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
      orderBy: [{ date: "desc" }, { time: "desc" }],
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
