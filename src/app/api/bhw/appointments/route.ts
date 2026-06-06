import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentResidentUser } from "@/lib/current-user";

export async function GET() {
  try {
    const user = await getCurrentResidentUser();

    if (!user || String(user.role) !== "BHW") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointments = await db.appointment.findMany({
      where: {
        barangayId: user.barangayId,
        resident: {
          barangayId: user.barangayId,
        },
      },
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
          },
        },
        resident: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            age: true,
            sex: true,
            contactNumber: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("BHW_APPOINTMENTS_GET_ERROR", error);

    return NextResponse.json(
      { error: "Failed to load appointments." },
      { status: 500 }
    );
  }
}
