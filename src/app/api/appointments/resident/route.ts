import { NextResponse } from "next/server";
import { resolveAuthedUser } from "@/lib/api-auth";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth";
import { logAuditEvent, AuditEventType } from "@/lib/blockchain";

function createSlots(startTime: string, endTime: string, slotMinutes: number) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const slots: string[] = [];

  const start = new Date();
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date();
  end.setHours(endHour, endMinute, 0, 0);

  while (start < end) {
    const hour = start.getHours();
    const minute = start.getMinutes();

    const isLunchBreak =
      hour === 12 || (hour === 13 && minute === 0 && slotMinutes === 60);

    if (!isLunchBreak && hour !== 12) {
      const slotHour = String(hour).padStart(2, "0");
      const slotMinute = String(minute).padStart(2, "0");
      slots.push(`${slotHour}:${slotMinute}`);
    }

    start.setMinutes(start.getMinutes() + slotMinutes);
  }

  return slots;
}

async function getApiUser() {
  return resolveAuthedUser({ resident: true });
}

export async function GET() {
  try {
    const user = await getApiUser();

    if (!user || String(user.role) !== "RESIDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const barangayId = user.barangayId;
    const resident = user.resident;

    if (!resident) {
      return NextResponse.json(
        { error: "Resident profile not found." },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availabilities = await db.doctorAvailability.findMany({
      where: {
        barangayId,
        date: {
          gte: today,
        },
      },
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            username: true,
            barangay: {
              select: {
                name: true,
              },
            },
          },
        },
        appointments: {
          where: {
            barangayId,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

const allMyAppointments = await db.appointment.findMany({
  where: {
    barangayId,
    residentId: resident.id,
    status: {
      not: "REJECTED",
    },
  },
  include: {
    doctor: {
      select: {
        fullName: true,
      },
    },
    availability: true,
  },
  orderBy: {
    createdAt: "desc",
  },
});

const formattedMyAppointments = allMyAppointments.map((appointment) => {
  const allSlots = createSlots(
    appointment.availability.startTime,
    appointment.availability.endTime,
    appointment.availability.slotMinutes
  );

  const slotIndex = allSlots.findIndex((slot) => slot === appointment.time);

  return {
    id: appointment.id,
    date: appointment.date,
    time: appointment.time,
    reason: appointment.reason,
    otherReason: appointment.otherReason,
    status: appointment.status,
    doctor: appointment.doctor,
    queueNumber: slotIndex >= 0 ? slotIndex + 1 : undefined,
    suggestion: appointment.suggestion,
  };
});

    const availableDoctors = availabilities.map((item) => {
  const allSlots = createSlots(
    item.startTime,
    item.endTime,
    item.slotMinutes
  );

  const takenSlots = item.appointments
    .filter((appointment) => appointment.status !== "REJECTED")
    .map((appointment) => appointment.time);

  const freeSlots = allSlots
    .map((slot, index) => ({
      time: slot,
      queueNumber: index + 1,
    }))
    .filter((slot) => !takenSlots.includes(slot.time));

  return {
    id: item.id,
    date: item.date,
    startTime: item.startTime,
    endTime: item.endTime,
    slotMinutes: item.slotMinutes,
    doctor: item.doctor,
    slots: freeSlots,
  };
});

return NextResponse.json({
  availableDoctors,
  myAppointments: formattedMyAppointments,
});

  } catch (error) {
    console.error("RESIDENT_APPOINTMENTS_GET_ERROR", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load appointments.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getApiUser();

    if (!user || String(user.role) !== "RESIDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const barangayId = user.barangayId;
    const resident = user.resident;

    if (!resident) {
      return NextResponse.json(
        { error: "Resident profile not found." },
        { status: 404 }
      );
    }

    const body = await req.json();

    const availabilityId = String(body.availabilityId || "").trim();
    const time = String(body.time || "").trim();
    const reason = String(body.reason || "").trim();
    const otherReason = String(body.otherReason || "").trim();

    if (!availabilityId || !time || !reason) {
      return NextResponse.json(
        { error: "Please complete all appointment fields." },
        { status: 400 }
      );
    }

    if (reason === "Others" && !otherReason) {
      return NextResponse.json(
        { error: "Please type your reason." },
        { status: 400 }
      );
    }

    const availability = await db.doctorAvailability.findFirst({
      where: {
        id: availabilityId,
        barangayId,
      },
      include: {
        appointments: {
          where: {
            barangayId,
          },
        },
      },
    });

    if (!availability) {
      return NextResponse.json(
        { error: "Doctor availability not found." },
        { status: 404 }
      );
    }

    

const residentAppointments = await db.appointment.findMany({
  where: {
    barangayId,
    residentId: resident.id,
    status: {
      not: "REJECTED",
    },
  },
});

const targetDate = new Date(availability.date).toDateString();

const alreadyHasAppointmentSameDay = residentAppointments.some(
  (appointment) => new Date(appointment.date).toDateString() === targetDate
);

if (alreadyHasAppointmentSameDay) {
  return NextResponse.json(
    { error: "You can only request one appointment per day." },
    { status: 400 }
  );
}

    const allSlots = createSlots(
      availability.startTime,
      availability.endTime,
      availability.slotMinutes
    );

    if (!allSlots.includes(time)) {
      return NextResponse.json(
        { error: "Invalid appointment time selected." },
        { status: 400 }
      );
    }

    const alreadyTaken = availability.appointments.some(
      (appointment) =>
        appointment.time === time && appointment.status !== "REJECTED"
    );

    if (alreadyTaken) {
      return NextResponse.json(
        { error: "This time slot is already taken." },
        { status: 400 }
      );
    }

    const appointment = await db.appointment.create({
      data: {
        availabilityId,
        doctorId: availability.doctorId,
        residentId: resident.id,
        barangayId,
        date: availability.date,
        time,
        reason,
        otherReason: reason === "Others" ? otherReason : null,
        status: "PENDING",
      },
    });

    // ── Blockchain: log appointment booked (fire-and-forget) ─────────────────
    logAuditEvent(
      AuditEventType.APPT_BOOKED,
      user.id,
      resident.id,
      barangayId,
      null,
      { role: user.role, appointmentId: appointment.id, date: appointment.date.toISOString(), time }
    ).catch(err => console.error("[blockchain] appt log failed:", err));
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json(
      {
        success: true,
        message: "Appointment request sent.",
        appointment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("RESIDENT_APPOINTMENTS_POST_ERROR", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to request appointment.",
      },
      { status: 500 }
    );
  }
}
