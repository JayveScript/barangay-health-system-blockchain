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

// Maps a diagnosis "condition" choice back to the boolean / detail fields
// captured during resident registration (Step 2 — Past Medical History), so
// a diagnosis can flip the matching field from "No" to "Yes".
const CONDITION_FIELDS: Record<string, { label: string; detailField?: string }> = {
  hasHypertension: { label: "Hypertension" },
  hasDiabetes: { label: "Diabetes" },
  hasStiHiv: { label: "STI / HIV" },
  hasHeartDisease: { label: "Heart Disease" },
  hasKidneyFailure: { label: "Kidney Failure" },
  hasTuberculosis: { label: "Tuberculosis" },
  hasAllergies: { label: "Allergies", detailField: "allergiesDetails" },
  hasCancer: { label: "Cancer", detailField: "cancerDetails" },
  hasOtherConditions: { label: "Other Conditions", detailField: "otherConditionsDetails" },
};

function mergeDetail(existing: string | null | undefined, addition?: string) {
  const add = (addition || "").trim();
  if (!add) return existing ?? null;
  if (!existing || !existing.trim()) return add;
  const trimmed = existing.trim();
  if (trimmed.toLowerCase().includes(add.toLowerCase())) return trimmed;
  return `${trimmed}; ${add}`;
}

export async function GET(req: Request) {
  try {
    const user = await getApiUser();
    if (!user || !ALLOWED_ROLES.includes(String(user.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const residentId = searchParams.get("residentId");

    const diagnoses = await db.diagnosis.findMany({
      where: {
        barangayId: user.barangayId,
        ...(residentId ? { residentId } : {}),
      },
      include: {
        resident: { select: { firstName: true, lastName: true, middleName: true } },
        diagnosedBy: { select: { fullName: true, role: true } },
        appointment: { select: { id: true, date: true, time: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(diagnoses);
  } catch (err) {
    console.error("DIAGNOSE_GET_ERROR", err);
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
    const appointmentId = body.appointmentId ? String(body.appointmentId).trim() : null;
    const isHealthy = Boolean(body.isHealthy);
    const notes = String(body.notes || "").trim();
    const rawConditions: string[] = Array.isArray(body.conditions) ? body.conditions : [];
    const details: Record<string, string> =
      body.details && typeof body.details === "object" ? body.details : {};

    if (!residentId) {
      return NextResponse.json({ error: "Please select a patient." }, { status: 400 });
    }

    const conditions = rawConditions.filter((key) => key in CONDITION_FIELDS);

    if (!isHealthy && conditions.length === 0 && !notes) {
      return NextResponse.json(
        { error: "Select at least one finding, mark the patient as healthy, or add notes." },
        { status: 400 }
      );
    }

    const resident = await db.resident.findFirst({
      where: { id: residentId, barangayId: user.barangayId },
      include: { medicalHistory: true },
    });
    if (!resident) {
      return NextResponse.json({ error: "Resident not found." }, { status: 404 });
    }

    if (appointmentId) {
      const appointment = await db.appointment.findFirst({
        where: { id: appointmentId, residentId, barangayId: user.barangayId },
      });
      if (!appointment) {
        return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
      }
    }

    const finalConditions = isHealthy ? [] : conditions;

    const diagnosis = await db.diagnosis.create({
      data: {
        residentId,
        diagnosedById: user.id,
        barangayId: user.barangayId,
        appointmentId,
        isHealthy,
        conditions: finalConditions,
        notes: notes || null,
      },
    });

    // Reflect findings on the resident's medical history — flip matching
    // Step 2 fields from "No" to "Yes" and append any typed detail notes.
    if (finalConditions.length > 0) {
      const history = resident.medicalHistory;
      const updateData: Record<string, boolean | string | null> = {};

      for (const key of finalConditions) {
        const field = CONDITION_FIELDS[key];
        updateData[key] = true;
        if (field.detailField) {
          updateData[field.detailField] = mergeDetail(
            history?.[field.detailField as keyof typeof history] as string | null | undefined,
            details[field.detailField]
          );
        }
      }

      await db.residentMedicalHistory.upsert({
        where: { residentId },
        update: updateData,
        create: {
          residentId,
          barangayId: user.barangayId,
          ...updateData,
        },
      });
    }

    return NextResponse.json(
      { success: true, message: "Diagnosis saved successfully.", diagnosis },
      { status: 201 }
    );
  } catch (err) {
    console.error("DIAGNOSE_POST_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
