import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentApiUser } from "@/lib/tenant-auth";

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

    if (hour !== 12) {
      slots.push(
        `${String(start.getHours()).padStart(2, "0")}:${String(
          start.getMinutes()
        ).padStart(2, "0")}`
      );
    }

    start.setMinutes(start.getMinutes() + slotMinutes);
  }

  return slots;
}

export async function GET() {
  try {
    const user = await getCurrentApiUser();
    const doctorId = user?.id;
    const barangayId = user?.barangayId;

    if (!user || user.role !== "DOCTOR" || !doctorId || !barangayId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [residents, allAppointments, activeAvailability] =
      await Promise.all([
        db.resident.findMany({
          where: {
            barangayId,
          },
          include: {
            medicalHistory: true,
            familyHistory: true,
            personalSocialHistory: true,
          },
        }),

        db.appointment.findMany({
          where: {
            barangayId,
          },
        }),

        db.doctorAvailability.findMany({
          where: {
            doctorId,
            barangayId,
            date: {
              gte: today,
            },
          },
          include: {
            appointments: {
              where: {
                barangayId,
              },
            },
          },
        }),
      ]);

    const totalResidents = residents.length;

    const medicalRecords = residents.filter(
      (resident) =>
        resident.medicalHistory ||
        resident.familyHistory ||
        resident.personalSocialHistory
    ).length;

    const male = residents.filter(
      (resident) => String(resident.sex || "").toUpperCase() === "MALE"
    ).length;

    const female = residents.filter(
      (resident) => String(resident.sex || "").toUpperCase() === "FEMALE"
    ).length;

    const other = Math.max(totalResidents - male - female, 0);

    const pending = allAppointments.filter(
      (appointment) => appointment.status === "PENDING"
    ).length;

    const accepted = allAppointments.filter(
      (appointment) => appointment.status === "ACCEPTED"
    ).length;

    const rejected = allAppointments.filter(
      (appointment) => appointment.status === "REJECTED"
    ).length;

    const totalSlots = activeAvailability.reduce((sum, item) => {
      return (
        sum + createSlots(item.startTime, item.endTime, item.slotMinutes).length
      );
    }, 0);

    const bookedSlots = activeAvailability.reduce((sum, item) => {
      return sum + item.appointments.length;
    }, 0);

    const openSlots = Math.max(totalSlots - bookedSlots, 0);

    return NextResponse.json({
      stats: {
        totalResidents,
        medicalRecords,
        totalAppointments: allAppointments.length,
      },

      gender: {
        male,
        female,
        other,
      },

      appointments: {
        pending,
        accepted,
        rejected,
      },

      conditions: {
        hypertension: residents.filter(
          (resident) => resident.medicalHistory?.hasHypertension
        ).length,

        diabetes: residents.filter(
          (resident) => resident.medicalHistory?.hasDiabetes
        ).length,

        tuberculosis: residents.filter(
          (resident) => resident.medicalHistory?.hasTuberculosis
        ).length,

        heartDisease: residents.filter(
          (resident) => resident.medicalHistory?.hasHeartDisease
        ).length,

        allergies: residents.filter(
          (resident) => resident.medicalHistory?.hasAllergies
        ).length,

        cancer: residents.filter((resident) => resident.medicalHistory?.hasCancer)
          .length,
      },

      todaySlots: {
        totalSlots,
        openSlots,
        bookedSlots,
        postedSchedules: activeAvailability.length,
      },
    });
  } catch (error) {
    console.error("DOCTOR_DASHBOARD_ERROR", error);

    return NextResponse.json(
      { error: "Failed to load doctor dashboard." },
      { status: 500 }
    );
  }
}
