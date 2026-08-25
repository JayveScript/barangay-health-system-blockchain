import { NextResponse } from "next/server";
import { resolveAuthedUser } from "@/lib/api-auth";
import { db } from "@/lib/db";

// GET: the resident's own pregnancy status + maternal record (if a health
// worker has filled one). POST: the resident self-declares as pregnant.
async function getResident() {
  const user = await resolveAuthedUser({ resident: true });
  if (!user || String(user.role) !== "RESIDENT" || !user.resident) return null;
  return user.resident;
}

export async function GET() {
  try {
    const resident = await getResident();
    if (!resident) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const record = await db.maternalRecord.findUnique({
      where: { residentId: resident.id },
      select: {
        data: true,
        updatedAt: true,
        createdBy: { select: { fullName: true, role: true } },
      },
    });

    return NextResponse.json({
      sex: resident.sex,
      isPregnant: resident.isPregnant ?? false,
      record: record
        ? { data: record.data, updatedAt: record.updatedAt, updatedBy: record.createdBy }
        : null,
    });
  } catch (err) {
    console.error("ME_MATERNAL_GET_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const resident = await getResident();
    if (!resident) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (String(resident.sex) !== "FEMALE") {
      return NextResponse.json(
        { error: "Only female residents can be marked pregnant." },
        { status: 400 }
      );
    }

    await db.resident.update({
      where: { id: resident.id },
      data: { isPregnant: true },
    });

    return NextResponse.json({ ok: true, isPregnant: true });
  } catch (err) {
    console.error("ME_MATERNAL_POST_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
