import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentResidentUser } from "@/lib/current-user";
import { sendDoctorAvailabilityEmail } from "@/lib/mail";

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

    if (hour !== 12) {
      const slotHour = String(hour).padStart(2, "0");
      const slotMinute = String(minute).padStart(2, "0");
      slots.push(`${slotHour}:${slotMinute}`);
    }

    start.setMinutes(start.getMinutes() + slotMinutes);
  }

  return slots;
}

export async function GET() {
  try {
    const user = await getCurrentResidentUser();

    if (!user || String(user.role) !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const barangayId = user.barangayId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availabilities = await db.doctorAvailability.findMany({
      where: {
        doctorId: user.id,
        barangayId,
        date: {
          gte: today,
        },
      },
      include: {
        appointments: {
          where: {
            barangayId,
            status: {
              not: "REJECTED",
            },
          },
          include: {
            resident: {
              include: {
                user: {
                  select: {
                    username: true,
                    email: true,
                    phoneNumber: true,
                    isVerified: true,
                  },
                },
                medicalHistory: true,
                familyHistory: true,
                personalSocialHistory: true,
              },
            },
          },
          orderBy: {
            time: "asc",
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    const data = availabilities.map((item) => {
      const allSlots = createSlots(
        item.startTime,
        item.endTime,
        item.slotMinutes
      );

      const takenSlots = item.appointments.map(
        (appointment) => appointment.time
      );

      const availableSlots = allSlots
        .map((slot, index) => ({
          time: slot,
          queueNumber: index + 1,
        }))
        .filter((slot) => !takenSlots.includes(slot.time));

      return {
        id: item.id,
        doctorId: item.doctorId,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        slotMinutes: item.slotMinutes,
        createdAt: item.createdAt,

        totalSlots: allSlots.length,
        remainingSlots: availableSlots.length,
        slots: availableSlots,

        appointments: item.appointments.map((appointment) => {
          const queueNumber =
            allSlots.findIndex((slot) => slot === appointment.time) + 1;

          const residentFullName = appointment.resident
            ? `${appointment.resident.firstName || ""} ${
                appointment.resident.middleName || ""
              } ${appointment.resident.lastName || ""}`
                .replace(/\s+/g, " ")
                .trim()
            : "Resident";

          return {
            id: appointment.id,
            availabilityId: appointment.availabilityId,
            doctorId: appointment.doctorId,
            residentId: appointment.residentId,
            date: appointment.date,
            time: appointment.time,
            reason: appointment.reason,
            otherReason: appointment.otherReason,
            status: appointment.status,
            createdAt: appointment.createdAt,
            queueNumber,

            resident: appointment.resident
              ? {
                  ...appointment.resident,
                  fullName: residentFullName,
                  email:
                    appointment.resident.email ||
                    appointment.resident.user?.email ||
                    null,
                  phoneNumber:
                    appointment.resident.phoneNumber ||
                    appointment.resident.user?.phoneNumber ||
                    null,
                  username: appointment.resident.user?.username || null,
                  isVerified:
                    appointment.resident.user?.isVerified ?? false,
                }
              : null,
          };
        }),
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("DOCTOR_APPOINTMENTS_GET_ERROR", error);

    return NextResponse.json(
      { error: "Failed to load appointments." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentResidentUser();

    if (!user || String(user.role) !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const barangayId = user.barangayId;
    const body = await req.json();

    const date = String(body.date || "").trim();
    const startTime = String(body.startTime || "").trim();
    const endTime = String(body.endTime || "").trim();
    const slotMinutes = Number(body.slotMinutes || 30);

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Please complete date and time fields." },
        { status: 400 }
      );
    }

    if (slotMinutes < 10) {
      return NextResponse.json(
        { error: "Slot minutes must be at least 10." },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "Start time must be earlier than end time." },
        { status: 400 }
      );
    }

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const existingAvailability = await db.doctorAvailability.findFirst({
      where: {
        doctorId: user.id,
        barangayId,
        date: selectedDate,
      },
    });

    if (existingAvailability) {
      return NextResponse.json(
        { error: "You already posted availability for this date." },
        { status: 400 }
      );
    }

    const availability = await db.doctorAvailability.create({
      data: {
        doctorId: user.id,
        barangayId,
        date: selectedDate,
        startTime,
        endTime,
        slotMinutes,
      },
    });

    const barangay = await db.barangay.findUnique({
      where: { id: barangayId },
      select: { name: true },
    });

    const residents = await db.resident.findMany({
      where: { barangayId },
      select: {
        email: true,
        user: { select: { email: true } },
      },
    });

    const barangayName = barangay?.name ?? "Barangay";

    const emailPromises = residents
      .map((r) => r.email || r.user?.email)
      .filter((email): email is string => !!email)
      .map((email) =>
        sendDoctorAvailabilityEmail(
          email,
          barangayName,
          user.fullName ?? "Doctor",
          availability.date,
          availability.startTime,
          availability.endTime,
          availability.slotMinutes
        ).catch((err) =>
          console.error(
            `Failed to send doctor availability email to ${email}:`,
            err
          )
        )
      );

    Promise.all(emailPromises);

    return NextResponse.json(
      {
        success: true,
        message: "Availability posted successfully.",
        availability,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("DOCTOR_APPOINTMENTS_POST_ERROR", error);

    return NextResponse.json(
      { error: "Failed to post availability." },
      { status: 500 }
    );
  }
}
