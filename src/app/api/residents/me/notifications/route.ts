import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth";

// Notification feed for the logged-in resident. Aggregates several sources into
// a single, time-sorted list:
//   1. diagnosis        — who diagnosed their condition (doctor name + barangay)
//   2. record-update    — who changed their medical-record status (a diagnosis
//                         that flipped a Past Medical History flag)
//   3. suggestion       — checkup / appointment suggestions from a doctor
//   4. availability      — doctors who posted upcoming available schedules
//   5. announcement     — barangay health center announcements
//   6. scan             — staff/admin who scanned & viewed their QR digital ID

type NotificationItem = {
  id: string;
  type:
    | "diagnosis"
    | "record-update"
    | "suggestion"
    | "availability"
    | "announcement"
    | "scan";
  title: string;
  message: string;
  doctorName: string | null;
  barangayName: string | null;
  conditions?: string[];
  actorName?: string | null;
  actorRole?: string | null;
  createdAt: string;
};

function humanizeRole(role?: string | null): string {
  if (!role) return "Staff";
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const CONDITION_LABELS: Record<string, string> = {
  hasHypertension: "Hypertension",
  hasDiabetes: "Diabetes",
  hasStiHiv: "STI / HIV",
  hasHeartDisease: "Heart Disease",
  hasKidneyFailure: "Kidney Failure",
  hasTuberculosis: "Tuberculosis",
  hasAllergies: "Allergies",
  hasCancer: "Cancer",
  hasOtherConditions: "Other Conditions",
};

async function getApiUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    return await db.user.findUnique({
      where: { id: payload.userId },
      include: { resident: true },
    });
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getApiUser();

    if (!user || String(user.role) !== "RESIDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resident = user.resident;
    const barangayId = user.barangayId;

    if (!resident) {
      return NextResponse.json(
        { error: "Resident profile not found." },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      diagnoses,
      suggestionAppointments,
      availabilities,
      announcements,
      scanLogs,
    ] = await Promise.all([
        // Diagnoses made for this resident
        db.diagnosis.findMany({
          where: { residentId: resident.id },
          include: {
            diagnosedBy: {
              select: {
                fullName: true,
                role: true,
                barangay: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        // Appointments carrying a doctor suggestion
        db.appointment.findMany({
          where: {
            residentId: resident.id,
            suggestion: { not: null },
            status: { not: "REJECTED" },
          },
          include: {
            doctor: {
              select: {
                fullName: true,
                barangay: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        // Upcoming doctor availability in the resident's barangay
        db.doctorAvailability.findMany({
          where: { barangayId, date: { gte: today } },
          include: {
            doctor: {
              select: {
                fullName: true,
                barangay: { select: { name: true } },
              },
            },
          },
          orderBy: { date: "asc" },
          take: 30,
        }),
        // Health center announcements for the barangay
        db.announcement.findMany({
          where: { barangayId },
          orderBy: { publishDate: "desc" },
          take: 30,
        }),
        // Staff/admin who successfully scanned & viewed this resident's QR ID
        db.qrScanAuditLog.findMany({
          where: { residentId: resident.id, action: "ACCESS_GRANTED" },
          include: { scannedBy: { select: { fullName: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
      ]);

    const items: NotificationItem[] = [];

    for (const d of diagnoses) {
      const doctorName = d.diagnosedBy?.fullName || "Health Worker";
      const barangayName = d.diagnosedBy?.barangay?.name || null;
      const conditionLabels = (d.conditions || []).map(
        (key) => CONDITION_LABELS[key] || key
      );

      // The diagnosis itself — who diagnosed the resident's condition.
      items.push({
        id: `diagnosis-${d.id}`,
        type: "diagnosis",
        title: d.isHealthy
          ? "You were assessed as healthy"
          : conditionLabels.length > 0
            ? `Diagnosed: ${conditionLabels.join(", ")}`
            : "New diagnosis recorded",
        message: d.isHealthy
          ? `Dr. ${doctorName} reviewed your condition and found no new health concerns.`
          : conditionLabels.length > 0
            ? `Dr. ${doctorName} recorded the following condition(s): ${conditionLabels.join(", ")}.`
            : `Dr. ${doctorName} recorded a new diagnosis for you.`,
        doctorName,
        barangayName,
        conditions: conditionLabels,
        createdAt: d.createdAt.toISOString(),
      });

      // A condition flip means the resident's medical record status changed.
      if (!d.isHealthy && conditionLabels.length > 0) {
        items.push({
          id: `record-update-${d.id}`,
          type: "record-update",
          title: "Your medical record status was updated",
          message: `Dr. ${doctorName} updated your medical records — marked ${conditionLabels.join(", ")} as present.${d.notes ? ` Note: ${d.notes}` : ""}`,
          doctorName,
          barangayName,
          conditions: conditionLabels,
          createdAt: d.createdAt.toISOString(),
        });
      }
    }

    for (const a of suggestionAppointments) {
      const doctorName = a.doctor?.fullName || "Doctor";
      items.push({
        id: `suggestion-${a.id}`,
        type: "suggestion",
        title: "Checkup / appointment suggestion",
        message: `Dr. ${doctorName} suggested: ${a.suggestion}`,
        doctorName,
        barangayName: a.doctor?.barangay?.name || null,
        createdAt: a.createdAt.toISOString(),
      });
    }

    for (const av of availabilities) {
      const doctorName = av.doctor?.fullName || "Doctor";
      const dateLabel = new Date(av.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      items.push({
        id: `availability-${av.id}`,
        type: "availability",
        title: "Doctor available for appointments",
        message: `Dr. ${doctorName} is available on ${dateLabel} from ${av.startTime} to ${av.endTime}.`,
        doctorName,
        barangayName: av.doctor?.barangay?.name || null,
        createdAt: av.createdAt.toISOString(),
      });
    }

    for (const an of announcements) {
      items.push({
        id: `announcement-${an.id}`,
        type: "announcement",
        title: an.title,
        message: an.content,
        doctorName: null,
        barangayName: null,
        createdAt: (an.publishDate || an.createdAt).toISOString(),
      });
    }

    for (const log of scanLogs) {
      const actorName = log.scannedBy?.fullName || "A staff member";
      const actorRole = humanizeRole(log.role);
      items.push({
        id: `scan-${log.id}`,
        type: "scan",
        title: "Your QR ID was scanned",
        message: `${actorRole} ${actorName} scanned and viewed your digital health ID.`,
        doctorName: null,
        barangayName: null,
        actorName,
        actorRole,
        createdAt: log.createdAt.toISOString(),
      });
    }

    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ notifications: items });
  } catch (error) {
    console.error("RESIDENT_NOTIFICATIONS_GET_ERROR", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load notifications.",
      },
      { status: 500 }
    );
  }
}
