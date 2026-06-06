import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth";

const ALLOWED_ROLES = ["BHW", "STAFF", "NURSE"];

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

function calcBMI(weightKg: number, heightCm: number) {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  if (bmi < 35) return "Obese Class I";
  if (bmi < 40) return "Obese Class II";
  return "Obese Class III";
}

export async function GET(req: Request) {
  try {
    const user = await getApiUser();
    if (!user || !ALLOWED_ROLES.includes(String(user.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const residentId = searchParams.get("residentId");

    const records = await db.bMIRecord.findMany({
      where: {
        barangayId: user.barangayId,
        ...(residentId ? { residentId } : {}),
      },
      include: {
        resident: { select: { firstName: true, lastName: true } },
        recordedBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(records);
  } catch (err) {
    console.error("BMI_GET_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getApiUser();
    if (!user || !ALLOWED_ROLES.includes(String(user.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const residentId = String(body.residentId || "").trim();
    const height = Number(body.height);
    const weight = Number(body.weight);
    const pulseRate = Number(body.pulseRate);

    if (!residentId || !height || !weight || !pulseRate) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (height <= 0 || height > 300) {
      return NextResponse.json({ error: "Invalid height value." }, { status: 400 });
    }
    if (weight <= 0 || weight > 500) {
      return NextResponse.json({ error: "Invalid weight value." }, { status: 400 });
    }
    if (pulseRate <= 0 || pulseRate > 300) {
      return NextResponse.json({ error: "Invalid pulse rate." }, { status: 400 });
    }

    const resident = await db.resident.findFirst({
      where: { id: residentId, barangayId: user.barangayId },
    });
    if (!resident) {
      return NextResponse.json({ error: "Resident not found." }, { status: 404 });
    }

    const bmi = parseFloat(calcBMI(weight, height).toFixed(2));
    const bmiCategory = getBMICategory(bmi);

    const record = await db.bMIRecord.create({
      data: {
        residentId,
        barangayId: user.barangayId,
        recordedById: user.id,
        height,
        weight,
        bmi,
        bmiCategory,
        pulseRate,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error("BMI_POST_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
